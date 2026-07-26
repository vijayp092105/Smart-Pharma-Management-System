const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Drug = sequelize.define('Drug', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  ndc: {
    type: DataTypes.STRING(20),
    unique: true,
    allowNull: false
  },
  brandName: {
    type: DataTypes.STRING(100),
    field: 'brand_name',
    allowNull: false
  },
  genericName: {
    type: DataTypes.STRING(100),
    field: 'generic_name',
    allowNull: false
  },
  dosage: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  expiryDate: {
    type: DataTypes.DATEONLY,
    field: 'expiry_date',
    allowNull: false
  },
  supplierId: {
    type: DataTypes.INTEGER,
    field: 'supplier_id',
    allowNull: true
  },
  purchasePrice: {
    type: DataTypes.DECIMAL(10, 2),
    field: 'purchase_price',
    allowNull: false
  },
  sellingPrice: {
    type: DataTypes.DECIMAL(10, 2),
    field: 'selling_price',
    allowNull: false
  },
  currentQuantity: {
    type: DataTypes.INTEGER,
    field: 'current_quantity',
    defaultValue: 100
  },
  minQuantity: {
    type: DataTypes.INTEGER,
    field: 'min_quantity',
    defaultValue: 20
  },
  maxQuantity: {
    type: DataTypes.INTEGER,
    field: 'max_quantity',
    defaultValue: 500
  }
}, {
  tableName: 'drugs',
  timestamps: true,
  underscored: true,
  hooks: {
    beforeCreate: (drug) => {
      // Ensure prices are positive
      if (drug.purchasePrice < 0) drug.purchasePrice = 0;
      if (drug.sellingPrice < 0) drug.sellingPrice = 0;
      if (drug.currentQuantity < 0) drug.currentQuantity = 0;
    }
  }
});

module.exports = Drug;