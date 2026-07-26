const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Prescription = sequelize.define('Prescription', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  patientId: {
    type: DataTypes.INTEGER,
    field: 'patient_id',
    allowNull: false
  },
  doctorId: {
    type: DataTypes.INTEGER,
    field: 'doctor_id',
    allowNull: false
  },
  drugId: {
    type: DataTypes.INTEGER,
    field: 'drug_id',
    allowNull: false
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1
    }
  },
  daysSupply: {
    type: DataTypes.INTEGER,
    field: 'days_supply',
    allowNull: false
  },
  refills: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  status: {
    type: DataTypes.ENUM('pending', 'filled', 'picked_up', 'cancelled'),
    defaultValue: 'pending'
  },
  filledDate: {
    type: DataTypes.DATEONLY,
    field: 'filled_date',
    allowNull: true
  },
  pickedUpDate: {
    type: DataTypes.DATEONLY,
    field: 'picked_up_date',
    allowNull: true
  }
}, {
  tableName: 'prescriptions',
  timestamps: true,
  underscored: true
});

module.exports = Prescription;