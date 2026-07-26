# telegram-bot/alerts.py
"""
Robust alert detector for SmartPharma.

Modifications:
- Safely parse expiry_date values (strings or date objects).
- Avoid calling .strftime on non-datetime objects.
- Defensive access to dict keys.
- Optional duplicate-alert guard if PharmacyQueries.alert_exists is available.
- Clear logging on failures.
"""
import logging
import os
from datetime import datetime, date, timedelta
from typing import List, Dict, Any, Optional
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger(__name__)

# Import your DB helper (adjust path if different)
from database import PharmacyQueries

# Helper: try to coerce a value to a date object
def parse_date_to_date(dval) -> Optional[date]:
    if dval is None:
        return None
    if isinstance(dval, date):
        return dval
    if isinstance(dval, datetime):
        return dval.date()
    s = str(dval).strip()
    if not s:
        return None
    # Try ISO formats first
    try:
        return datetime.fromisoformat(s).date()
    except Exception:
        pass
    # Try common formats
    fmts = ("%Y-%m-%d", "%d-%m-%Y", "%d/%m/%Y", "%m/%d/%Y", "%b-%y", "%b-%Y", "%b %d %Y")
    for f in fmts:
        try:
            return datetime.strptime(s, f).date()
        except Exception:
            continue
    # Last resort: try to extract yyyy-mm-dd with regex
    import re
    m = re.search(r"(\d{4})[-/](\d{1,2})[-/](\d{1,2})", s)
    if m:
        try:
            y, mo, da = int(m.group(1)), int(m.group(2)), int(m.group(3))
            return date(y, mo, da)
        except Exception:
            pass
    return None


class AlertDetector:
    def __init__(self):
        self.low_stock_threshold = int(os.getenv("LOW_STOCK_THRESHOLD", 20))
        self.expiry_warning_days = int(os.getenv("EXPIRY_WARNING_DAYS", 30))
        self.last_check_time: Optional[datetime] = None

        logger.info("Alert detector initialized with:")
        logger.info(f"  - Low stock threshold: {self.low_stock_threshold} units")
        logger.info(f"  - Expiry warning: {self.expiry_warning_days} days")

    def check_all_alerts(self) -> Dict[str, List[Dict[str, Any]]]:
        """Check for all types of alerts."""
        alerts = {"low_stock": [], "expiry": [], "reorder": []}
        try:
            low_stock_alerts = self.check_low_stock()
            alerts["low_stock"] = low_stock_alerts

            expiry_alerts = self.check_expiry()
            alerts["expiry"] = expiry_alerts

            if low_stock_alerts:
                reorder_alerts = self.generate_reorder_suggestions(low_stock_alerts)
                alerts["reorder"] = reorder_alerts

            self.last_check_time = datetime.now()
            total_alerts = sum(len(alerts[key]) for key in alerts)
            logger.info(f"Alert check completed. Found {total_alerts} alerts.")
            return alerts
        except Exception as e:
            logger.exception(f"Error checking alerts: {e}")
            return alerts

    def check_low_stock(self) -> List[Dict[str, Any]]:
        """Check for low stock drugs."""
        try:
            low_stock_drugs = PharmacyQueries.get_low_stock_drugs(self.low_stock_threshold)
            alerts = []

            for drug in low_stock_drugs:
                try:
                    alert = self._create_low_stock_alert(drug)
                    # Avoid duplicates if helper exists
                    try:
                        if hasattr(PharmacyQueries, "alert_exists") and PharmacyQueries.alert_exists(
                            "low_stock", drug.get("id")
                        ):
                            logger.debug("Low stock alert already exists for drug id %s", drug.get("id"))
                        else:
                            alert_id = PharmacyQueries.create_alert(
                                "low_stock",
                                drug.get("id"),
                                alert["message"],
                                alert["severity"],
                            )
                            if alert_id:
                                logger.debug("Created low stock alert ID: %s for %s", alert_id, drug.get("brand_name"))
                    except Exception as db_e:
                        logger.warning("Failed to persist low stock alert for %s: %s", drug.get("brand_name"), db_e)

                    alerts.append(alert)
                except Exception as inner:
                    logger.exception("Failed to create low stock alert for drug %s: %s", drug.get("id"), inner)

            return alerts
        except Exception as e:
            logger.exception("Error checking low stock: %s", e)
            return []

    def check_expiry(self) -> List[Dict[str, Any]]:
        """Check for expiring drugs."""
        try:
            expiring_drugs = PharmacyQueries.get_expiring_drugs(self.expiry_warning_days)
            alerts = []

            for drug in expiring_drugs:
                try:
                    # Accept both days_until_expiry or compute if expiry_date present
                    days_left = None
                    if isinstance(drug, dict):
                        days_left = drug.get("days_until_expiry")
                    if days_left is None:
                        expiry_val = drug.get("expiry_date") if isinstance(drug, dict) else None
                        expiry_dt = parse_date_to_date(expiry_val)
                        if expiry_dt:
                            days_left = (expiry_dt - date.today()).days
                        else:
                            # can't compute; skip this row
                            logger.debug("Skipping expiry check for drug id %s due to unparseable expiry_date: %s", drug.get("id"), expiry_val)
                            continue

                    # Determine severity
                    if days_left is None:
                        severity = "info"
                    elif days_left <= 7:
                        severity = "critical"
                    elif days_left <= 14:
                        severity = "warning"
                    else:
                        severity = "info"

                    alert = self._create_expiry_alert(drug, days_left, severity)
                    # Persist (guard duplicates if helper exists)
                    try:
                        if hasattr(PharmacyQueries, "alert_exists") and PharmacyQueries.alert_exists(
                            "expiry_warning", drug.get("id")
                        ):
                            logger.debug("Expiry alert already exists for drug id %s", drug.get("id"))
                        else:
                            alert_id = PharmacyQueries.create_alert(
                                "expiry_warning",
                                drug.get("id"),
                                alert["message"],
                                severity,
                            )
                            if alert_id:
                                logger.debug("Created expiry alert ID: %s for %s", alert_id, drug.get("brand_name"))
                    except Exception as db_e:
                        logger.warning("Failed to persist expiry alert for %s: %s", drug.get("brand_name"), db_e)

                    alerts.append(alert)
                except Exception as inner:
                    logger.exception("Failed to create expiry alert for drug %s: %s", drug.get("id"), inner)

            return alerts
        except Exception as e:
            logger.exception("Error checking expiry: %s", e)
            return []

    def generate_reorder_suggestions(self, low_stock_alerts: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Generate reorder suggestions for low stock drugs."""
        reorder_alerts = []
        for alert in low_stock_alerts:
            try:
                if alert.get("severity") == "critical":
                    suggestion = self._create_reorder_suggestion(alert)
                    reorder_alerts.append(suggestion)
            except Exception as e:
                logger.exception("Failed to create reorder suggestion for alert %s: %s", alert.get("drug_id"), e)
        return reorder_alerts

    def _create_low_stock_alert(self, drug: Dict[str, Any]) -> Dict[str, Any]:
        """Create a low stock alert dictionary."""
        quantity = int(drug.get("current_quantity") or 0)
        min_quantity = int(drug.get("min_quantity") or 0)

        if quantity <= 5:
            severity = "critical"
            emoji = "🔴"
        elif quantity <= 10:
            severity = "critical"
            emoji = "🟠"
        else:
            severity = "warning"
            emoji = "🟡"

        expiry_val = drug.get("expiry_date")
        expiry_dt = parse_date_to_date(expiry_val)
        expiry_str = expiry_dt.strftime("%Y-%m-%d") if expiry_dt else "N/A"

        message = (
            f"{emoji} *LOW STOCK ALERT*\n"
            f"*Drug:* {drug.get('brand_name') or 'Unknown'} ({drug.get('generic_name') or '—'})\n"
            f"*NDC:* {drug.get('ndc') or '—'}\n"
            f"*Current Stock:* {quantity} units\n"
            f"*Minimum Required:* {min_quantity} units\n"
            f"*Supplier:* {drug.get('supplier_name') or 'Unknown'}\n"
            f"*Expiry:* {expiry_str}"
        )

        return {
            "type": "low_stock",
            "drug_id": drug.get("id"),
            "drug_name": drug.get("brand_name"),
            "generic_name": drug.get("generic_name"),
            "current_quantity": quantity,
            "min_quantity": min_quantity,
            "supplier": drug.get("supplier_name"),
            "supplier_phone": drug.get("supplier_phone"),
            "message": message,
            "severity": severity,
            "emoji": emoji,
            "timestamp": datetime.now(),
        }

    def _create_expiry_alert(self, drug: Dict[str, Any], days_left: int, severity: str) -> Dict[str, Any]:
        """Create an expiry alert dictionary."""
        if severity == "critical":
            emoji = "🔴"
            urgency = "URGENT"
        elif severity == "warning":
            emoji = "🟠"
            urgency = "SOON"
        else:
            emoji = "🟡"
            urgency = "UPCOMING"

        expiry_val = drug.get("expiry_date")
        expiry_dt = parse_date_to_date(expiry_val)
        expiry_str = expiry_dt.strftime("%Y-%m-%d") if expiry_dt else (str(expiry_val) if expiry_val else "Unknown")

        current_qty = int(drug.get("current_quantity") or 0)

        message = (
            f"{emoji} *EXPIRY ALERT* - {urgency}\n"
            f"*Drug:* {drug.get('brand_name') or 'Unknown'} ({drug.get('generic_name') or '—'})\n"
            f"*NDC:* {drug.get('ndc') or '—'}\n"
            f"*Expiry Date:* {expiry_str}\n"
            f"*Days Remaining:* {int(days_left) if days_left is not None else 'N/A'} days\n"
            f"*Current Stock:* {current_qty} units\n"
            f"*Action Required:* Move to front (FEFO) or apply discount"
        )

        return {
            "type": "expiry_warning",
            "drug_id": drug.get("id"),
            "drug_name": drug.get("brand_name"),
            "generic_name": drug.get("generic_name"),
            "expiry_date": expiry_dt,
            "days_remaining": int(days_left) if days_left is not None else None,
            "current_quantity": current_qty,
            "message": message,
            "severity": severity,
            "emoji": emoji,
            "urgency": urgency,
            "timestamp": datetime.now(),
        }

    def _create_reorder_suggestion(self, alert: Dict[str, Any]) -> Dict[str, Any]:
        """Create a reorder suggestion based on low stock alert."""
        try:
            min_q = int(alert.get("min_quantity") or 0)
            reorder_quantity = max(min_q * 3, 1)  # Suggest at least 1 unit if min is 0
        except Exception:
            reorder_quantity = 10

        message = (
            f"🛒 *REORDER SUGGESTION*\n"
            f"*Drug:* {alert.get('drug_name')}\n"
            f"*Current Stock:* {alert.get('current_quantity')} units\n"
            f"*Suggested Reorder:* {reorder_quantity} units\n"
            f"*Supplier:* {alert.get('supplier')}\n"
            f"*Contact:* {alert.get('supplier_phone') or 'Check supplier info'}\n"
            "\n*Suggested Actions:*\n"
            "1. Contact supplier for bulk pricing\n"
            "2. Update inventory after receipt\n"
            "3. Set up auto-reorder for future"
        )

        return {
            "type": "reorder_suggestion",
            "drug_id": alert.get("drug_id"),
            "drug_name": alert.get("drug_name"),
            "current_quantity": alert.get("current_quantity"),
            "suggested_quantity": reorder_quantity,
            "supplier": alert.get("supplier"),
            "supplier_phone": alert.get("supplier_phone"),
            "message": message,
            "severity": "info",
            "timestamp": datetime.now(),
        }

    def get_stats(self) -> Dict[str, Any]:
        """Get statistics about current alerts."""
        try:
            low_stock = PharmacyQueries.get_low_stock_drugs(self.low_stock_threshold)
            expiring = PharmacyQueries.get_expiring_drugs(self.expiry_warning_days)
            critical_expiring = [d for d in expiring if (d.get("days_until_expiry") or 9999) <= 7]

            return {
                "total_drugs_low_stock": len(low_stock),
                "total_drugs_expiring": len(expiring),
                "critical_expiring": len(critical_expiring),
                "last_check": self.last_check_time,
                "next_check_scheduled": (self.last_check_time + timedelta(minutes=int(os.getenv("CHECK_INTERVAL_MINUTES", 5))))
                if self.last_check_time
                else None,
            }
        except Exception as e:
            logger.exception("Error getting stats: %s", e)
            return {}


# Singleton instance
alert_detector = AlertDetector()
