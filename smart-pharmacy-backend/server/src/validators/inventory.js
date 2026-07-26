const Joi = require('joi');

const inventorySchemas = {
  // Drug filter schema
  drugFilter: Joi.object({
    supplier: Joi.string().valid('all', 'supplier1', 'supplier2', 'expired'),
    search: Joi.string().allow(''),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    sortBy: Joi.string().valid('brandName', 'expiryDate', 'currentQuantity', 'sellingPrice'),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc')
  }),
  
  // Prescription filter schema
  prescriptionFilter: Joi.object({
    status: Joi.string().valid('all', 'pickedUp', 'filled', 'pending', 'withRefills'),
    search: Joi.string().allow(''),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20)
  }),
  
  // CSV upload schema
  csvUpload: Joi.object({
    datasetType: Joi.string().valid('patients', 'doctors', 'drugs', 'prescriptions', 'suppliers', 'insurance', 'auto')
  })
};

module.exports = inventorySchemas;