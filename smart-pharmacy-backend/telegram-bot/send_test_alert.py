#!/usr/bin/env python3
"""Send a test alert to Telegram."""
import asyncio
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from bot_handler import bot_handler
from datetime import datetime

async def send_test_alert():
    """Send a test alert."""
    print("Sending test alert...")
    
    test_alert = {
        'type': 'low_stock',
        'drug_id': 1,
        'drug_name': 'Test Drug',
        'generic_name': 'Test Generic',
        'current_quantity': 5,
        'min_quantity': 20,
        'supplier': 'Test Supplier',
        'supplier_phone': '+1234567890',
        'message': (
            "🔴 *TEST ALERT - LOW STOCK*\n"
            "*Drug:* Test Drug (Test Generic)\n"
            "*Current Stock:* 5 units\n"
            "*Minimum Required:* 20 units\n"
            "*Supplier:* Test Supplier\n"
            "*Phone:* +1234567890\n"
            "*This is a test alert*"
        ),
        'severity': 'critical',
        'timestamp': datetime.now()
    }
    
    # Note: This requires the bot to be running
    # For standalone test, you'd need to create a minimal application
    print("Test alert created. Start the bot to send it.")
    print(f"Alert message:\n{test_alert['message']}")

if __name__ == '__main__':
    asyncio.run(send_test_alert())