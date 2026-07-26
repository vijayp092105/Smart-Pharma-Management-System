# SmartPharma Telegram Bot User Guide

## 📱 Getting Started

1. **Find the bot:** Search for `@YourBotUsername` in Telegram
2. **Start the bot:** Send `/start` to begin
3. **Authorize alerts:** The bot will automatically send alerts to configured chat

## 🎯 Available Commands

### Basic Commands
- `/start` - Welcome message and setup
- `/help` - Show help information
- `/stats` - Current inventory statistics

### Alert Commands
- `/alerts` - Check all active alerts
- `/lowstock` - View low stock drugs
- `/expiring` - View expiring drugs
- `/reorder` - Get reorder suggestions
- `/history` - View alert history
- `/checknow` - Force immediate check

### Management Commands
- `/silence` - Silence alerts for 24h
- `/enable` - Re-enable alerts
- `/settings` - Configure alert preferences

## 🔔 Alert Types

### Severity Levels
- 🔴 **Critical:** Immediate action required
  - Stock < 5 units
  - Expiry < 7 days
- 🟠 **Warning:** Attention needed soon
  - Stock < 10 units  
  - Expiry < 14 days
- 🟡 **Info:** Monitor situation
  - Stock < 20 units
  - Expiry < 30 days

### Alert Actions
Each alert includes buttons for quick actions:
- 📞 Call supplier
- 🛒 Place reorder
- 📊 Apply FEFO
- ✅ Mark as resolved

## ⚙️ Configuration

### Alert Thresholds (in .env file)
LOW_STOCK_THRESHOLD=20 # Alert when below this quantity
EXPIRY_WARNING_DAYS=30 # Alert when expiry within days
CHECK_INTERVAL_MINUTES=5 # How often to check


### Silence Alerts
To temporarily stop alerts:
1. Send `/silence` to bot
2. Choose duration (1h, 4h, 24h)
3. Send `/enable` to resume

## 🚨 Emergency Contacts

If the bot stops working:
1. Check server status: `systemctl status smartpharma-telegram`
2. Check logs: `journalctl -u smartpharma-telegram -f`
3. Contact IT support

## 📞 Support

For help with the bot:
- In-app: Send `/help`
- Email: pharmacy-support@yourcompany.com
- Phone: IT Support Desk