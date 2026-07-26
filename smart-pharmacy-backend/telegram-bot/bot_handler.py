import logging
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import (
    Application, CommandHandler, MessageHandler, 
    CallbackQueryHandler, filters, ContextTypes
)
from telegram.constants import ParseMode
import os
from dotenv import load_dotenv
from datetime import datetime
from typing import Dict, List, Any

from alerts import alert_detector
from database import PharmacyQueries, Database

load_dotenv()
logger = logging.getLogger(__name__)

class TelegramBotHandler:
    def __init__(self):
        self.token = os.getenv('TELEGRAM_BOT_TOKEN')
        self.chat_id = os.getenv('TELEGRAM_CHAT_ID')
        self.application = None
        
        if not self.token:
            raise ValueError("TELEGRAM_BOT_TOKEN not found in environment variables")
        
        logger.info("Telegram bot handler initialized")
    
    async def start(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Send welcome message when command /start is issued."""
        welcome_message = (
            "🤖 *Welcome to SmartPharma Alert Bot!*\n\n"
            "I'm here to help you manage your pharmacy inventory with real-time alerts.\n\n"
            "*Available Commands:*\n"
            "✅ /start - Show this welcome message\n"
            "⚠️ /alerts - Check current alerts\n"
            "💊 /lowstock - Check low stock drugs\n"
            "🛒 /reorder - Get reorder suggestions\n"
            "📋 /history - View alert history\n"
            "🔄 /checknow - Force immediate alert check\n"
            "🔕 /silence - Silence alerts for 24 hours\n"
            "🔔 /enable - Re-enable alerts\n"
            "❓ /help - Show help message\n\n"
            "I'll automatically send you alerts for:\n"
            "• Low stock medications\n"
            "• Expiring drugs\n"
            "• Reorder suggestions"
        )
        
        await update.message.reply_text(
            welcome_message,
            parse_mode=ParseMode.MARKDOWN,
            disable_web_page_preview=True
        )
    
    async def help_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Send help message."""
        help_message = (
            "📖 *SmartPharma Alert Bot Help*\n\n"
            "*Alert Types:*\n"
            "🔴 Critical: Stock < 5 units or expiry < 7 days\n"
            "🟠 Warning: Stock < 10 units or expiry < 14 days\n"
            "🟡 Info: Stock < 20 units or expiry < 30 days\n\n"
            "*Automated Checks:*\n"
            "• Low stock: Every 5 minutes\n"
            "• Expiry: Every 5 minutes\n"
            "• Daily summary: 9 AM daily\n\n"
            "*Manual Commands:*\n"
            "Use /alerts to see all active alerts\n"
            "Use /checknow for immediate check\n"
            "Use /silence to pause alerts for 24h\n\n"
            "Need help? Contact pharmacy administrator."
        )
        
        await update.message.reply_text(
            help_message,
            parse_mode=ParseMode.MARKDOWN
        )
    
    async def check_alerts(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Manually check for alerts."""
        await update.message.reply_text("🔍 Checking for alerts...")
        
        alerts = alert_detector.check_all_alerts()
        total_alerts = sum(len(alerts[key]) for key in alerts)
        
        if total_alerts == 0:
            await update.message.reply_text(
                "✅ No active alerts at the moment. Everything looks good!",
                parse_mode=ParseMode.MARKDOWN
            )
            return
        
        # Send summary
        summary = self._create_alert_summary(alerts)
        await update.message.reply_text(
            summary,
            parse_mode=ParseMode.MARKDOWN,
            disable_web_page_preview=True
        )
        
        # Send individual alerts
        sent_count = 0
        for alert_type in ['low_stock', 'expiry', 'reorder']:
            for alert in alerts[alert_type]:
                if sent_count < 10:  # Limit to 10 messages to avoid flooding
                    await self._send_alert_to_telegram(alert)
                    sent_count += 1
        
        if sent_count < total_alerts:
            await update.message.reply_text(
                f"📋 And {total_alerts - sent_count} more alerts...",
                parse_mode=ParseMode.MARKDOWN
            )
    
    async def get_stats(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Get inventory statistics."""
        stats = alert_detector.get_stats()
        
        if not stats:
            await update.message.reply_text("❌ Could not fetch statistics.")
            return
        
        stats_message = (
            f"📊 *Pharmacy Inventory Stats*\n\n"
            f"*Low Stock Drugs:* {stats.get('total_drugs_low_stock', 0)}\n"
            f"*Expiring Drugs (30 days):* {stats.get('total_drugs_expiring', 0)}\n"
            f"*Critical Expiring (7 days):* {stats.get('critical_expiring', 0)}\n\n"
            f"*Last Check:* {stats.get('last_check', 'Never')}\n"
            f"*Next Check:* {stats.get('next_check_scheduled', 'Not scheduled')}\n\n"
            f"*Alert Thresholds:*\n"
            f"• Low stock: < {os.getenv('LOW_STOCK_THRESHOLD', 20)} units\n"
            f"• Expiry warning: < {os.getenv('EXPIRY_WARNING_DAYS', 30)} days"
        )
        
        keyboard = [
            [InlineKeyboardButton("📋 View Alerts", callback_data="view_alerts")],
            [InlineKeyboardButton("🔄 Check Now", callback_data="check_now")],
            [InlineKeyboardButton("⚙️ Settings", callback_data="settings")]
        ]
        reply_markup = InlineKeyboardMarkup(keyboard)
        
        await update.message.reply_text(
            stats_message,
            parse_mode=ParseMode.MARKDOWN,
            reply_markup=reply_markup
        )
    
    async def get_low_stock(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Get low stock drugs."""
        low_stock_drugs = PharmacyQueries.get_low_stock_drugs(
            int(os.getenv('LOW_STOCK_THRESHOLD', 20))
        )
        
        if not low_stock_drugs:
            await update.message.reply_text(
                "✅ No drugs are low in stock. Good job!",
                parse_mode=ParseMode.MARKDOWN
            )
            return
        
        message = "📉 *Low Stock Drugs*\n\n"
        
        for i, drug in enumerate(low_stock_drugs[:10]):  # Limit to 10
            message += (
                f"*{i+1}. {drug['brand_name']}*\n"
                f"   Stock: {drug['current_quantity']}/{drug['min_quantity']} units\n"
                f"   Supplier: {drug['supplier_name'] or 'Unknown'}\n\n"
            )
        
        if len(low_stock_drugs) > 10:
            message += f"... and {len(low_stock_drugs) - 10} more drugs\n"
        
        keyboard = [
            [InlineKeyboardButton("🛒 Reorder Suggestions", callback_data="reorder_suggest")],
            [InlineKeyboardButton("📞 Contact Suppliers", callback_data="contact_suppliers")]
        ]
        reply_markup = InlineKeyboardMarkup(keyboard)
        
        await update.message.reply_text(
            message,
            parse_mode=ParseMode.MARKDOWN,
            reply_markup=reply_markup
        )
    
    async def get_expiring(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Get expiring drugs."""
        expiring_drugs = PharmacyQueries.get_expiring_drugs(
            int(os.getenv('EXPIRY_WARNING_DAYS', 30))
        )
        
        if not expiring_drugs:
            await update.message.reply_text(
                "✅ No drugs are expiring in the next 30 days.",
                parse_mode=ParseMode.MARKDOWN
            )
            return
        
        message = "⏰ *Expiring Drugs (Next 30 Days)*\n\n"
        
        for i, drug in enumerate(expiring_drugs[:10]):  # Limit to 10
            days_left = int(drug['days_until_expiry'])
            
            if days_left <= 7:
                status = "🔴 CRITICAL"
            elif days_left <= 14:
                status = "🟠 WARNING"
            else:
                status = "🟡 WATCH"
            
            message += (
                f"*{i+1}. {drug['brand_name']}*\n"
                f"   Expires: {drug['expiry_date'].strftime('%Y-%m-%d')}\n"
                f"   Days left: {days_left} ({status})\n"
                f"   Stock: {drug['current_quantity']} units\n\n"
            )
        
        if len(expiring_drugs) > 10:
            message += f"... and {len(expiring_drugs) - 10} more drugs\n"
        
        keyboard = [
            [InlineKeyboardButton("📊 Apply FEFO", callback_data="apply_fefo")],
            [InlineKeyboardButton("💰 Create Discount", callback_data="create_discount")]
        ]
        reply_markup = InlineKeyboardMarkup(keyboard)
        
        await update.message.reply_text(
            message,
            parse_mode=ParseMode.MARKDOWN,
            reply_markup=reply_markup
        )
    
    async def get_reorder_suggestions(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Get reorder suggestions."""
        low_stock_drugs = PharmacyQueries.get_low_stock_drugs(
            int(os.getenv('LOW_STOCK_THRESHOLD', 20))
        )
        
        critical_drugs = [d for d in low_stock_drugs if d['current_quantity'] <= 10]
        
        if not critical_drugs:
            await update.message.reply_text(
                "✅ No urgent reorders needed at the moment.",
                parse_mode=ParseMode.MARKDOWN
            )
            return
        
        message = "🛒 *Reorder Suggestions*\n\n"
        
        for i, drug in enumerate(critical_drugs[:5]):  # Limit to 5
            suggested_qty = drug['min_quantity'] * 3
            estimated_cost = suggested_qty * 50  # Placeholder for actual cost
            
            message += (
                f"*{i+1}. {drug['brand_name']}*\n"
                f"   Current: {drug['current_quantity']} units\n"
                f"   Suggested: {suggested_qty} units\n"
                f"   Supplier: {drug['supplier_name']}\n"
                f"   Phone: {drug['supplier_phone'] or 'N/A'}\n"
                f"   Est. Cost: ${estimated_cost:,.2f}\n\n"
            )
        
        keyboard = [
            [InlineKeyboardButton("📞 Call Supplier", callback_data="call_supplier_1")],
            [InlineKeyboardButton("📧 Email PO", callback_data="email_po")],
            [InlineKeyboardButton("✅ Mark Ordered", callback_data="mark_ordered")]
        ]
        reply_markup = InlineKeyboardMarkup(keyboard)
        
        await update.message.reply_text(
            message,
            parse_mode=ParseMode.MARKDOWN,
            reply_markup=reply_markup
        )
    
    async def get_alert_history(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Get alert history."""
        history = PharmacyQueries.get_alert_history(limit=10)
        
        if not history:
            await update.message.reply_text("No alert history found.")
            return
        
        message = "📋 *Recent Alert History*\n\n"
        
        for i, alert in enumerate(history):
            time_ago = self._format_time_ago(alert['created_at'])
            status = "✅" if alert['resolved'] else "🔄"
            
            message += (
                f"*{i+1}. {alert['alert_type'].replace('_', ' ').title()}*\n"
                f"   Drug: {alert['brand_name'] or 'System'}\n"
                f"   Time: {time_ago}\n"
                f"   Status: {status}\n\n"
            )
        
        await update.message.reply_text(
            message,
            parse_mode=ParseMode.MARKDOWN
        )
    
    async def button_handler(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Handle button callbacks."""
        query = update.callback_query
        await query.answer()
        
        data = query.data
        
        if data == "view_alerts":
            await self.check_alerts(update, context)
        elif data == "check_now":
            await query.edit_message_text("🔄 Checking alerts now...")
            await self.check_alerts(update, context)
        elif data == "reorder_suggest":
            await self.get_reorder_suggestions(update, context)
        elif data.startswith("call_supplier"):
            await query.edit_message_text("📞 Opening phone dialer...")
        elif data == "email_po":
            await query.edit_message_text("📧 Generating purchase order email...")
        elif data == "mark_ordered":
            await query.edit_message_text("✅ Marked as ordered in system.")
    
    async def send_alert(self, alert: Dict[str, Any]):
        """Send an alert to the configured chat."""
        if not self.chat_id:
            logger.error("TELEGRAM_CHAT_ID not configured")
            return False
        
        try:
            # Create keyboard for alert actions
            keyboard = []
            
            if alert['type'] == 'low_stock':
                keyboard = [
                    [InlineKeyboardButton("🛒 Reorder", callback_data=f"reorder_{alert['drug_id']}")],
                    [InlineKeyboardButton("📞 Supplier", callback_data=f"supplier_{alert['drug_id']}")],
                    [InlineKeyboardButton("✅ Ignore 24h", callback_data=f"ignore_{alert['drug_id']}")]
                ]
            elif alert['type'] == 'expiry_warning':
                keyboard = [
                    [InlineKeyboardButton("📊 FEFO", callback_data=f"fefo_{alert['drug_id']}")],
                    [InlineKeyboardButton("💰 Discount", callback_data=f"discount_{alert['drug_id']}")],
                    [InlineKeyboardButton("✅ Resolved", callback_data=f"resolve_{alert['drug_id']}")]
                ]
            
            reply_markup = InlineKeyboardMarkup(keyboard) if keyboard else None
            
            # Send the alert
            await self.application.bot.send_message(
                chat_id=self.chat_id,
                text=alert['message'],
                parse_mode=ParseMode.MARKDOWN,
                reply_markup=reply_markup,
                disable_web_page_preview=True
            )
            
            logger.info(f"Sent {alert['type']} alert for {alert.get('drug_name', 'system')}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send alert: {e}")
            return False
    
    async def _send_alert_to_telegram(self, alert: Dict[str, Any]):
        """Helper to send alert and update database."""
        success = await self.send_alert(alert)
        
        # Mark as sent in database if we have alert_id
        if success and 'alert_id' in alert:
            PharmacyQueries.mark_alert_sent(alert['alert_id'])
    
    def _create_alert_summary(self, alerts: Dict[str, List]) -> str:
        """Create a summary of all alerts."""
        total_low_stock = len(alerts['low_stock'])
        total_expiry = len(alerts['expiry'])
        total_reorder = len(alerts['reorder'])
        
        critical_low = sum(1 for a in alerts['low_stock'] if a['severity'] == 'critical')
        critical_expiry = sum(1 for a in alerts['expiry'] if a['severity'] == 'critical')
        
        summary = (
            f"📊 *Alert Summary*\n\n"
            f"*Total Alerts:* {total_low_stock + total_expiry + total_reorder}\n\n"
            f"📉 *Low Stock:* {total_low_stock}\n"
            f"   🔴 Critical: {critical_low}\n"
            f"   🟠 Warning: {total_low_stock - critical_low}\n\n"
            f"⏰ *Expiring Soon:* {total_expiry}\n"
            f"   🔴 Critical: {critical_expiry}\n"
            f"   🟠 Warning: {total_expiry - critical_expiry}\n\n"
            f"🛒 *Reorder Suggestions:* {total_reorder}\n\n"
            f"*Timestamp:* {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
        )
        
        return summary
    
    def _format_time_ago(self, dt: datetime) -> str:
        """Format datetime as time ago string."""
        now = datetime.now()
        diff = now - dt
        
        if diff.days > 0:
            return f"{diff.days} day{'s' if diff.days > 1 else ''} ago"
        elif diff.seconds > 3600:
            hours = diff.seconds // 3600
            return f"{hours} hour{'s' if hours > 1 else ''} ago"
        elif diff.seconds > 60:
            minutes = diff.seconds // 60
            return f"{minutes} minute{'s' if minutes > 1 else ''} ago"
        else:
            return "just now"

# Singleton instance
bot_handler = TelegramBotHandler()