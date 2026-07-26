const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Patient = sequelize.define('Patient', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  patientId: {
    type: DataTypes.INTEGER,
    field: 'patient_id',
    unique: true,
    allowNull: false
  },
  firstName: {
    type: DataTypes.STRING(50),
    field: 'first_name',
    allowNull: false
  },
  lastName: {
    type: DataTypes.STRING(50),
    field: 'last_name',
    allowNull: false
  },
  birthdate: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  gender: {
    type: DataTypes.STRING(10),
    allowNull: true
  },
  insurance: {
    type: DataTypes.STRING(50),
    allowNull: true
  }
}, {
  tableName: 'patients',
  timestamps: true,
  underscored: true
});

module.exports = Patient;