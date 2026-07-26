const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const SalesTransaction = sequelize.define('SalesTransaction', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  drugId: {
    type: DataTypes.INTEGER,
    field: 'drug_id',
    allowNull: false
  },
  prescriptionId: {
    type: DataTypes.INTEGER,
    field: 'prescription_id',
    allowNull: true
  },
  quantitySold: {
    type: DataTypes.INTEGER,
    field: 'quantity_sold',
    allowNull: false
  },
  saleAmount: {
    type: DataTypes.DECIMAL(10, 2),
    field: 'sale_amount',
    allowNull: false
  },
  transactionDate: {
    type: DataTypes.DATEONLY,
    field: 'transaction_date',
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'sales_transactions',
  timestamps: true,
  underscored: true
});

module.exports = SalesTransaction;