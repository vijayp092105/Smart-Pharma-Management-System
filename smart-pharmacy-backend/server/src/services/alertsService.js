// server/src/services/alertsService.js
const { Op, col } = require('sequelize');
const { AlertHistory, Drug } = require('../models');
const axios = require('axios');

class AlertService {
  constructor() {
    this.telegramWebhookUrl = process.env.TELEGRAM_WEBHOOK_URL || 'http://localhost:5000/api/telegram/webhook';
  }
  
  async checkAndSendAlerts() {
    console.log('🔍 Checking for alerts...');
    
    try {
      // Check low stock
      const lowStockAlerts = await this.checkLowStock();
      
      // Check expiry
      const expiryAlerts = await this.checkExpiry();
      
      const allAlerts = [...lowStockAlerts, ...expiryAlerts];
      
      // Send to Telegram if configured
      if (process.env.ENABLE_TELEGRAM_ALERTS === 'true') {
        await this.sendToTelegram(allAlerts);
      }
      
      // Save to database
      await this.saveAlertsToDatabase(allAlerts);
      
      console.log(`✅ Sent ${allAlerts.length} alerts`);
      return allAlerts;
      
    } catch (error) {
      console.error('❌ Alert check failed:', error);
      return [];
    }
  }
  
  async checkLowStock(threshold = 20) {
    const lowStockDrugs = await Drug.findAll({
      where: {
        currentQuantity: { [Op.lt]: threshold }
      },
      include: ['supplier']
    });
    
    return lowStockDrugs.map(drug => ({
      type: 'low_stock',
      drugId: drug.id,
      drugName: drug.brandName,
      currentQuantity: drug.currentQuantity,
      minQuantity: drug.minQuantity,
      supplier: drug.supplier?.name,
      message: `⚠️ LOW STOCK: ${drug.brandName} has ${drug.currentQuantity} units (min: ${drug.minQuantity})`,
      severity: drug.currentQuantity < 10 ? 'critical' : 'warning',
      timestamp: new Date()
    }));
  }
  
  async checkExpiry(daysThreshold = 30) {
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + daysThreshold);
    
    const expiringDrugs = await Drug.findAll({
      where: {
        expiryDate: {
          [Op.between]: [new Date(), thirtyDaysFromNow]
        }
      }
    });
    
    return expiringDrugs.map(drug => {
      const daysLeft = Math.ceil((new Date(drug.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
      let severity = 'info';
      
      if (daysLeft <= 7) severity = 'critical';
      else if (daysLeft <= 14) severity = 'warning';
      
      return {
        type: 'expiry_warning',
        drugId: drug.id,
        drugName: drug.brandName,
        expiryDate: drug.expiryDate,
        daysRemaining: daysLeft,
        message: `⏰ EXPIRING: ${drug.brandName} expires in ${daysLeft} days`,
        severity,
        timestamp: new Date()
      };
    });
  }
  
  async sendToTelegram(alerts) {
    if (!process.env.TELEGRAM_BOT_TOKEN || !process.env.TELEGRAM_CHAT_ID) {
      console.warn('Telegram credentials not configured');
      return;
    }
    
    for (const alert of alerts) {
      if (alert.severity === 'critical' || alert.severity === 'warning') {
        try {
          await axios.post(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
            chat_id: process.env.TELEGRAM_CHAT_ID,
            text: alert.message,
            parse_mode: 'Markdown'
          });
          
          // Delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 100));
          
        } catch (error) {
          console.error('Failed to send Telegram alert:', error.message);
        }
      }
    }
  }
  
  async saveAlertsToDatabase(alerts) {
    for (const alert of alerts) {
      try {
        await AlertHistory.create({
          alertType: alert.type,
          drugId: alert.drugId,
          message: alert.message,
          severity: alert.severity,
          sentToTelegram: true,
          resolved: false
        });
      } catch (error) {
        console.error('Failed to save alert to database:', error.message);
      }
    }
  }
  
  async getRecentAlerts(limit = 10) {
    return await AlertHistory.findAll({
      include: ['drug'],
      limit,
      order: [['createdAt', 'DESC']]
    });
  }
  
  async markAlertResolved(alertId) {
    const alert = await AlertHistory.findByPk(alertId);
    if (alert) {
      alert.resolved = true;
      await alert.save();
      return true;
    }
    return false;
  }
}

module.exports = new AlertService();