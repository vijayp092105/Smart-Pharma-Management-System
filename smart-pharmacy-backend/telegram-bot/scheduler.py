import asyncio
import logging
from datetime import datetime, time
from typing import Dict, List, Any
import schedule
import time as tm
from threading import Thread
import os
from dotenv import load_dotenv

from alerts import alert_detector
from bot_handler import bot_handler
from database import PharmacyQueries

load_dotenv()
logger = logging.getLogger(__name__)

class AlertScheduler:
    def __init__(self):
        self.check_interval = int(os.getenv('CHECK_INTERVAL_MINUTES', 5))
        self.enable_alerts = os.getenv('ENABLE_ALERTS', 'true').lower() == 'true'
        self.silent_until = None
        self.is_running = False
        
        logger.info(f"Scheduler initialized with {self.check_interval} minute intervals")
    
    async def start(self, application):
        """Start the scheduler."""
        if not self.enable_alerts:
            logger.warning("Alerts are disabled in configuration")
            return
        
        self.is_running = True
        
        # Schedule periodic checks
        schedule.every(self.check_interval).minutes.do(
            lambda: asyncio.create_task(self._check_and_send_alerts(application))
        )
        
        # Schedule daily summary at 9 AM
        schedule.every().day.at("09:00").do(
            lambda: asyncio.create_task(self._send_daily_summary(application))
        )
        
        # Start scheduler in background thread
        scheduler_thread = Thread(target=self._run_scheduler, daemon=True)
        scheduler_thread.start()
        
        logger.info("Alert scheduler started")
        
        # Initial check
        await self._check_and_send_alerts(application)
    
    def stop(self):
        """Stop the scheduler."""
        self.is_running = False
        schedule.clear()
        logger.info("Alert scheduler stopped")
    
    def _run_scheduler(self):
        """Run the scheduler in a background thread."""
        while self.is_running:
            schedule.run_pending()
            tm.sleep(1)
    
    async def _check_and_send_alerts(self, application):
        """Check for alerts and send them."""
        if self._is_silenced():
            logger.debug("Alerts are silenced, skipping check")
            return
        
        logger.info("Running scheduled alert check...")
        
        try:
            # Set application for bot handler
            bot_handler.application = application
            
            # Check for alerts
            alerts = alert_detector.check_all_alerts()
            
            # Send alerts
            sent_count = 0
            for alert_type in ['low_stock', 'expiry', 'reorder']:
                for alert in alerts[alert_type]:
                    # Only send critical and warning alerts automatically
                    if alert['severity'] in ['critical', 'warning']:
                        await bot_handler._send_alert_to_telegram(alert)
                        sent_count += 1
                        
                        # Small delay to avoid rate limiting
                        await asyncio.sleep(0.5)
            
            if sent_count > 0:
                logger.info(f"Sent {sent_count} alerts")
            else:
                logger.debug("No alerts to send")
                
        except Exception as e:
            logger.error(f"Error in scheduled alert check: {e}")
    
    async def _send_daily_summary(self, application):
        """Send daily summary report."""
        if self._is_silenced():
            return
        
        logger.info("Sending daily summary...")
        
        try:
            bot_handler.application = application
            
            # Get stats
            stats = alert_detector.get_stats()
            low_stock_drugs = PharmacyQueries.get_low_stock_drugs(20)
            expiring_drugs = PharmacyQueries.get_expiring_drugs(30)
            
            # Create summary message
            summary = self._create_daily_summary(stats, low_stock_drugs, expiring_drugs)
            
            # Send to Telegram
            await bot_handler.application.bot.send_message(
                chat_id=bot_handler.chat_id,
                text=summary,
                parse_mode="MARKDOWN",
                disable_web_page_preview=True
            )
            
            logger.info("Daily summary sent")
            
        except Exception as e:
            logger.error(f"Error sending daily summary: {e}")
    
    def _create_daily_summary(self, stats: Dict, low_stock: List, expiring: List) -> str:
        """Create daily summary message."""
        today = datetime.now().strftime('%Y-%m-%d')
        
        critical_expiring = [d for d in expiring if d['days_until_expiry'] <= 7]
        urgent_low_stock = [d for d in low_stock if d['current_quantity'] <= 10]
        
        summary = (
            f"📅 *Daily Pharmacy Summary - {today}*\n\n"
            f"📊 *Inventory Status:*\n"
            f"• Total Drugs Low Stock: {len(low_stock)}\n"
            f"• Urgent Low Stock (<10 units): {len(urgent_low_stock)}\n"
            f"• Drugs Expiring in 30 Days: {len(expiring)}\n"
            f"• Critical Expiring (<7 days): {len(critical_expiring)}\n\n"
        )
        
        if urgent_low_stock:
            summary += f"🔴 *Urgent Reorders Needed:*\n"
            for drug in urgent_low_stock[:3]:  # Top 3
                summary += f"• {drug['brand_name']}: {drug['current_quantity']} units\n"
            summary += "\n"
        
        if critical_expiring:
            summary += f"⏰ *Critical Expirations:*\n"
            for drug in critical_expiring[:3]:  # Top 3
                days = int(drug['days_until_expiry'])
                summary += f"• {drug['brand_name']}: {days} day{'s' if days > 1 else ''} left\n"
            summary += "\n"
        
        summary += (
            f"✅ *Recommended Actions:*\n"
            f"1. Process urgent reorders\n"
            f"2. Apply FEFO to expiring drugs\n"
            f"3. Review supplier contracts\n\n"
            f"Have a productive day! 💊"
        )
        
        return summary
    
    def silence_alerts(self, hours: int = 24):
        """Silence alerts for specified hours."""
        from datetime import timedelta
        self.silent_until = datetime.now() + timedelta(hours=hours)
        logger.info(f"Alerts silenced until {self.silent_until}")
    
    def enable_alerts_now(self):
        """Re-enable alerts immediately."""
        self.silent_until = None
        logger.info("Alerts re-enabled")
    
    def _is_silenced(self) -> bool:
        """Check if alerts are currently silenced."""
        if self.silent_until and datetime.now() < self.silent_until:
            return True
        return False
    
    def get_status(self) -> Dict[str, Any]:
        """Get scheduler status."""
        next_run = schedule.next_run()
        
        return {
            'is_running': self.is_running,
            'check_interval_minutes': self.check_interval,
            'next_scheduled_check': next_run.isoformat() if next_run else None,
            'alerts_enabled': self.enable_alerts,
            'silenced_until': self.silent_until.isoformat() if self.silent_until else None,
            'is_silenced': self._is_silenced()
        }

# Singleton instance
alert_scheduler = AlertScheduler()