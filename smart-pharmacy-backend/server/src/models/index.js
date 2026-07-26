const Patient = require('./Patient');
const Doctor = require('./Doctor');
const Supplier = require('./Supplier');
const Insurance = require('./Insurance');
const Drug = require('./Drug');
const Prescription = require('./Prescription');
const AlertHistory = require('./AlertHistory');
const ChatHistory = require('./ChatHistory');
const SalesTransaction = require('./SalesTransaction');

// Define associations
Drug.belongsTo(Supplier, { foreignKey: 'supplierId', as: 'supplier' });
Supplier.hasMany(Drug, { foreignKey: 'supplierId', as: 'drugs' });

Prescription.belongsTo(Patient, { foreignKey: 'patientId', as: 'patient' });
Prescription.belongsTo(Doctor, { foreignKey: 'doctorId', as: 'doctor' });
Prescription.belongsTo(Drug, { foreignKey: 'drugId', as: 'drug' });

Patient.hasMany(Prescription, { foreignKey: 'patientId', as: 'prescriptions' });
Doctor.hasMany(Prescription, { foreignKey: 'doctorId', as: 'prescriptions' });
Drug.hasMany(Prescription, { foreignKey: 'drugId', as: 'prescriptions' });

AlertHistory.belongsTo(Drug, { foreignKey: 'drugId', as: 'drug' });
Drug.hasMany(AlertHistory, { foreignKey: 'drugId', as: 'alerts' });

SalesTransaction.belongsTo(Drug, { foreignKey: 'drugId', as: 'drug' });
SalesTransaction.belongsTo(Prescription, { foreignKey: 'prescriptionId', as: 'prescription' });

Drug.hasMany(SalesTransaction, { foreignKey: 'drugId', as: 'sales' });
Prescription.hasOne(SalesTransaction, { foreignKey: 'prescriptionId', as: 'sale' });

module.exports = {
  Patient,
  Doctor,
  Supplier,
  Insurance,
  Drug,
  Prescription,
  AlertHistory,
  ChatHistory,
  SalesTransaction
};