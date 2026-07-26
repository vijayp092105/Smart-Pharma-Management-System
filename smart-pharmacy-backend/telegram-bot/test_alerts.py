#!/usr/bin/env python3
"""Test script for alert system."""
import asyncio
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import Database, PharmacyQueries
from alerts import alert_detector
from bot_handler import bot_handler
from telegram.ext import Application

async def test_alerts():
    """Test the alert system."""
    print("🔍 Testing Alert System...")
    
    # Initialize database
    Database.initialize()
    
    # Test 1: Check low stock
    print("\n1. Checking low stock drugs...")
    low_stock = PharmacyQueries.get_low_stock_drugs(20)
    print(f"   Found {len(low_stock)} low stock drugs")
    
    # Test 2: Check expiring drugs
    print("\n2. Checking expiring drugs...")
    expiring = PharmacyQueries.get_expiring_drugs(30)
    print(f"   Found {len(expiring)} expiring drugs (30 days)")
    
    # Test 3: Generate alerts
    print("\n3. Generating alerts...")
    alerts = alert_detector.check_all_alerts()
    
    total = sum(len(alerts[key]) for key in alerts)
    print(f"   Generated {total} alerts:")
    print(f"   - Low stock: {len(alerts['low_stock'])}")
    print(f"   - Expiry: {len(alerts['expiry'])}")
    print(f"   - Reorder: {len(alerts['reorder'])}")
    
    # Test 4: Show sample alerts
    print("\n4. Sample alerts:")
    if alerts['low_stock']:
        print(f"   Low stock sample: {alerts['low_stock'][0]['message'][:100]}...")
    if alerts['expiry']:
        print(f"   Expiry sample: {alerts['expiry'][0]['message'][:100]}...")
    
    print("\n✅ Alert system test completed!")
    
    # Cleanup
    Database.close_all()

if __name__ == '__main__':
    asyncio.run(test_alerts())