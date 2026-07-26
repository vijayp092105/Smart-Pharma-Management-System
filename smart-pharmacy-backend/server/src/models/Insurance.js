const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Insurance = sequelize.define('Insurance', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(100),
    unique: true,
    allowNull: false
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  coPay: {
    type: DataTypes.BOOLEAN,
    field: 'co_pay',
    defaultValue: false
  }
}, {
  tableName: 'insurance',
  timestamps: true,
  underscored: true
});

module.exports = Insurance;