# Telegram Bot Setup Checklist

## ✅ Pre-requisites
- [ ] Python 3.8+ installed
- [ ] PostgreSQL database running
- [ ] Pharmacy database populated
- [ ] Telegram account created

## 🤖 Bot Creation
- [ ] Created bot via @BotFather
- [ ] Copied API Token
- [ ] Disabled Group Privacy
- [ ] Enabled Inline Mode
- [ ] Saved Chat ID from @userinfobot

## ⚙️ Configuration
- [ ] Updated `.env` file with:
  - TELEGRAM_BOT_TOKEN
  - TELEGRAM_CHAT_ID  
  - Database credentials
  - Alert thresholds

## 🚀 Installation
- [ ] Created virtual environment
- [ ] Installed dependencies
- [ ] Tested database connection
- [ ] Tested alert detection

## 🧪 Testing
- [ ] Bot responds to `/start`
- [ ] Can send manual alerts
- [ ] Automatic alerts working
- [ ] Buttons and actions work
- [ ] Alert history saves to DB

## 📈 Monitoring
- [ ] Set up logging
- [ ] Created systemd service
- [ ] Tested restart behavior
- [ ] Alert escalation configured

## 🆘 Troubleshooting Common Issues

### Bot not responding
1. Check if token is correct
2. Verify bot is not banned
3. Check internet connection

### No alerts received
1. Check database connection
2. Verify alert thresholds
3. Check if alerts are silenced

### Database errors
1. Verify credentials in .env
2. Check PostgreSQL is running
3. Verify pharmacy_db exists