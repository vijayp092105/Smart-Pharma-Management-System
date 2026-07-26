#!/usr/bin/env python3
import logging
from telegram.ext import Application, CommandHandler, CallbackQueryHandler
from telegram.error import TelegramError
import os
from dotenv import load_dotenv
import asyncio

from bot_handler import bot_handler
from scheduler import alert_scheduler
from database import Database

# Configure logging
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

def main():
    """Start the bot."""
    # Check required environment variables
    token = os.getenv('TELEGRAM_BOT_TOKEN')
    if not token:
        logger.error("TELEGRAM_BOT_TOKEN not found in environment variables")
        return
    
    # Initialize database
    try:
        Database.initialize()
        logger.info("Database initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize database: {e}")
        return
    
    # Create application
    application = Application.builder().token(token).build()
    
    # Register command handlers
    application.add_handler(CommandHandler("start", bot_handler.start))
    application.add_handler(CommandHandler("help", bot_handler.help_command))
    application.add_handler(CommandHandler("stats", bot_handler.get_stats))
    application.add_handler(CommandHandler("alerts", bot_handler.check_alerts))
    application.add_handler(CommandHandler("lowstock", bot_handler.get_low_stock))
    application.add_handler(CommandHandler("expiring", bot_handler.get_expiring))
    application.add_handler(CommandHandler("reorder", bot_handler.get_reorder_suggestions))
    application.add_handler(CommandHandler("history", bot_handler.get_alert_history))
    application.add_handler(CommandHandler("checknow", bot_handler.check_alerts))
    
    # Register button handlers
    application.add_handler(CallbackQueryHandler(bot_handler.button_handler))
    
    # Add error handler
    application.add_error_handler(error_handler)
    
    # Store application in bot handler
    bot_handler.application = application
    
    # Start the scheduler
    async def start_scheduler():
        await alert_scheduler.start(application)
    
    # Run the bot
    logger.info("Starting SmartPharma Alert Bot...")
    
    # Create event loop for scheduler
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    
    # Start bot with scheduler
    application.run_polling(
        allowed_updates=['message', 'callback_query'],
        close_loop=False
    )

async def error_handler(update, context):
    """Handle errors in the bot."""
    logger.error(f"Update {update} caused error {context.error}")
    
    try:
        # Notify admin of error
        if bot_handler.chat_id:
            await context.bot.send_message(
                chat_id=bot_handler.chat_id,
                text=f"⚠️ Bot error: {context.error}"
            )
    except:
        pass

if __name__ == '__main__':
    main()