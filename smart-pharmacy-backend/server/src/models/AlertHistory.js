const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const AlertHistory = sequelize.define('AlertHistory', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  alertType: {
    type: DataTypes.ENUM('low_stock', 'expiry_warning', 'reorder_suggestion'),
    field: 'alert_type',
    allowNull: false
  },
  drugId: {
    type: DataTypes.INTEGER,
    field: 'drug_id',
    allowNull: true
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  severity: {
    type: DataTypes.ENUM('info', 'warning', 'critical'),
    defaultValue: 'warning'
  },
  sentToTelegram: {
    type: DataTypes.BOOLEAN,
    field: 'sent_to_telegram',
    defaultValue: false
  },
  resolved: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  tableName: 'alert_history',
  timestamps: true,
  underscored: true
});

module.exports = AlertHistory;