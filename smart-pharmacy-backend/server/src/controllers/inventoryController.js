const { Drug, Patient, Doctor, Supplier, Insurance, Prescription } = require('../models');
const { successResponse, errorResponse, serverError } = require('../utils/response');
const inventorySchemas = require('../validators/inventory');
const { Op } = require('sequelize');

class InventoryController {
  // Get inventory data by dataset type
  // inside server/src/controllers/inventoryController.js
// Defensive getInventoryData: validates dataset param and returns helpful message
async getInventoryData(req, res) {
  try {
    const rawDataset = String(req.params.dataset || '').trim();

    // Defensive: someone may call "/api/inventory/:dataset" literally
    if (!rawDataset || rawDataset === ':dataset') {
      return res.status(400).json({
        success: false,
        message: 'Invalid dataset parameter. Use one of: drugs, suppliers, patients, doctors, prescriptions, insurance, alerts. Example: /api/inventory/drugs?search=lipitor'
      });
    }

    const dataset = rawDataset.toLowerCase();

    switch (dataset) {
      case 'drugs':
        return this.getDrugsData(req, res);
      case 'suppliers':
        return this.getSuppliersData ? this.getSuppliersData(req, res) : res.status(501).json({ success: false, message: 'Suppliers dataset not implemented' });
      case 'patients':
        return this.getPatientsData ? this.getPatientsData(req, res) : res.status(501).json({ success: false, message: 'Patients dataset not implemented' });
      case 'doctors':
        return this.getDoctorsData ? this.getDoctorsData(req, res) : res.status(501).json({ success: false, message: 'Doctors dataset not implemented' });
      case 'prescriptions':
        return this.getPrescriptionsData ? this.getPrescriptionsData(req, res) : res.status(501).json({ success: false, message: 'Prescriptions dataset not implemented' });
      case 'insurance':
        return this.getInsuranceData ? this.getInsuranceData(req, res) : res.status(501).json({ success: false, message: 'Insurance dataset not implemented' });
      case 'alerts':
        return this.getLowStockAlerts(req, res);
      default:
        return res.status(400).json({
          success: false,
          message: `Invalid dataset: ${rawDataset}`,
          available: ['drugs', 'suppliers', 'patients', 'doctors', 'prescriptions', 'insurance', 'alerts']
        });
    }
  } catch (err) {
    console.error('getInventoryData error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error', error: err.message });
  }
}

  
  // Get drugs data with filtering
  async getDrugsData(req, res) {
    try {
      const { search = '', filter = 'all', page = 1, limit = 20 } = req.query;
      const offset = (page - 1) * limit;
      
      // Build where clause
      const where = {};
      
      // Search filter
      if (search) {
        where[Op.or] = [
          { brandName: { [Op.iLike]: `%${search}%` } },
          { genericName: { [Op.iLike]: `%${search}%` } },
          { ndc: { [Op.iLike]: `%${search}%` } }
        ];
      }
      
      // Category filter
      if (filter !== 'all') {
        if (filter === 'supplier1') {
          where.supplierId = 1; // Cardinal Health
        } else if (filter === 'supplier2') {
          where.supplierId = 2; // McKesson
        } else if (filter === 'expired') {
          where.expiryDate = { [Op.lt]: new Date() };
        }
      }
      
      const { count, rows: drugs } = await Drug.findAndCountAll({
        where,
        include: [{
          association: 'supplier',
          attributes: ['id', 'name']
        }],
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['brandName', 'ASC']]
      });
      
      // Format response to match frontend
      const formattedDrugs = drugs.map(drug => ({
        brandName: drug.brandName,
        genericName: drug.genericName,
        NDC: drug.ndc,
        dosage: drug.dosage,
        expDate: this.formatExpiryDate(drug.expiryDate),
        supID: drug.supplierId,
        purchasePrice: parseFloat(drug.purchasePrice),
        sellPrice: parseFloat(drug.sellingPrice),
        currentQuantity: drug.currentQuantity,
        isExpired: new Date(drug.expiryDate) < new Date(),
        supplierName: drug.supplier?.name || 'Unknown'
      }));
      
      return successResponse(res, {
        data: formattedDrugs,
        total: count,
        page: parseInt(page),
        totalPages: Math.ceil(count / limit),
        filters: {
          search,
          filter,
          availableFilters: ['all', 'supplier1', 'supplier2', 'expired']
        }
      }, 'Drugs data fetched successfully');
      
    } catch (error) {
      return serverError(res, error);
    }
  }
  
  // Get patients data
  async getPatientsData(req, res) {
    try {
      const { search = '', page = 1, limit = 20 } = req.query;
      const offset = (page - 1) * limit;
      
      const where = {};
      if (search) {
        where[Op.or] = [
          { firstName: { [Op.iLike]: `%${search}%` } },
          { lastName: { [Op.iLike]: `%${search}%` } },
          { phone: { [Op.iLike]: `%${search}%` } },
          { insurance: { [Op.iLike]: `%${search}%` } }
        ];
      }
      
      const { count, rows: patients } = await Patient.findAndCountAll({
        where,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['lastName', 'ASC']]
      });
      
      // Format date for frontend
      const formattedPatients = patients.map(patient => ({
        patientID: patient.patientId,
        firstName: patient.firstName,
        lastName: patient.lastName,
        birthdate: this.formatDate(patient.birthdate),
        address: patient.address,
        phone: patient.phone,
        gender: patient.gender || 'N/A',
        insurance: patient.insurance || 'None'
      }));
      
      return successResponse(res, {
        data: formattedPatients,
        total: count,
        page: parseInt(page),
        totalPages: Math.ceil(count / limit)
      }, 'Patients data fetched successfully');
      
    } catch (error) {
      return serverError(res, error);
    }
  }
  
  // Get doctors data
  async getDoctorsData(req, res) {
    try {
      const { search = '', page = 1, limit = 20 } = req.query;
      const offset = (page - 1) * limit;
      
      const where = {};
      if (search) {
        where[Op.or] = [
          { name: { [Op.iLike]: `%${search}%` } },
          { phone: { [Op.iLike]: `%${search}%` } },
          { address: { [Op.iLike]: `%${search}%` } }
        ];
      }
      
      const { count, rows: doctors } = await Doctor.findAndCountAll({
        where,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['name', 'ASC']]
      });
      
      const formattedDoctors = doctors.map(doctor => ({
        physID: doctor.physId,
        name: doctor.name,
        address: doctor.address,
        phone: doctor.phone
      }));
      
      return successResponse(res, {
        data: formattedDoctors,
        total: count,
        page: parseInt(page),
        totalPages: Math.ceil(count / limit)
      }, 'Doctors data fetched successfully');
      
    } catch (error) {
      return serverError(res, error);
    }
  }
  
  // Get suppliers data
  async getSuppliersData(req, res) {
    try {
      const { search = '', page = 1, limit = 20 } = req.query;
      const offset = (page - 1) * limit;
      
      const where = {};
      if (search) {
        where[Op.or] = [
          { name: { [Op.iLike]: `%${search}%` } },
          { phone: { [Op.iLike]: `%${search}%` } },
          { address: { [Op.iLike]: `%${search}%` } }
        ];
      }
      
      const { count, rows: suppliers } = await Supplier.findAndCountAll({
        where,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['name', 'ASC']]
      });
      
      const formattedSuppliers = suppliers.map(supplier => ({
        supID: supplier.supId,
        name: supplier.name,
        address: supplier.address,
        phone: supplier.phone
      }));
      
      return successResponse(res, {
        data: formattedSuppliers,
        total: count,
        page: parseInt(page),
        totalPages: Math.ceil(count / limit)
      }, 'Suppliers data fetched successfully');
      
    } catch (error) {
      return serverError(res, error);
    }
  }
  
  // Get prescriptions data
  async getPrescriptionsData(req, res) {
    try {
      const { search = '', filter = 'all', page = 1, limit = 20 } = req.query;
      const offset = (page - 1) * limit;
      
      // Build where clause
      const where = {};
      
      // Search filter
      if (search) {
        where[Op.or] = [
          { '$drug.ndc$': { [Op.iLike]: `%${search}%` } },
          { '$patient.patientId$': { [Op.eq]: parseInt(search) || 0 } }
        ];
      }
      
      // Status filter
      if (filter !== 'all') {
        switch (filter) {
          case 'pickedUp':
            where.status = 'picked_up';
            break;
          case 'filled':
            where.status = 'filled';
            break;
          case 'pending':
            where.status = 'pending';
            break;
          case 'withRefills':
            where.refills = { [Op.gt]: 0 };
            break;
        }
      }
      
      const { count, rows: prescriptions } = await Prescription.findAndCountAll({
        where,
        include: [
          {
            association: 'patient',
            attributes: ['id', 'patientId', 'firstName', 'lastName']
          },
          {
            association: 'doctor',
            attributes: ['id', 'physId', 'name']
          },
          {
            association: 'drug',
            attributes: ['id', 'ndc', 'brandName', 'genericName']
          }
        ],
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['createdAt', 'DESC']]
      });
      
      const formattedPrescriptions = prescriptions.map(prescription => ({
        patientID: prescription.patient?.patientId || 0,
        physID: prescription.doctor?.physId || 0,
        NDC: prescription.drug?.ndc || '',
        qty: prescription.quantity,
        days: prescription.daysSupply,
        refills: prescription.refills,
        status: this.formatPrescriptionStatus(prescription.status),
        patientName: prescription.patient ? `${prescription.patient.firstName} ${prescription.patient.lastName}` : 'Unknown',
        doctorName: prescription.doctor?.name || 'Unknown',
        drugName: prescription.drug?.brandName || 'Unknown'
      }));
      
      return successResponse(res, {
        data: formattedPrescriptions,
        total: count,
        page: parseInt(page),
        totalPages: Math.ceil(count / limit),
        filters: {
          search,
          filter,
          availableFilters: ['all', 'pickedUp', 'filled', 'pending', 'withRefills']
        }
      }, 'Prescriptions data fetched successfully');
      
    } catch (error) {
      return serverError(res, error);
    }
  }
  
  // Get insurance data
  async getInsuranceData(req, res) {
    try {
      const { search = '', page = 1, limit = 20 } = req.query;
      const offset = (page - 1) * limit;
      
      const where = {};
      if (search) {
        where[Op.or] = [
          { name: { [Op.iLike]: `%${search}%` } },
          { phone: { [Op.iLike]: `%${search}%` } }
        ];
      }
      
      const { count, rows: insurance } = await Insurance.findAndCountAll({
        where,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['name', 'ASC']]
      });
      
      const formattedInsurance = insurance.map(item => ({
        name: item.name,
        phone: item.phone,
        coPay: item.coPay ? 'Yes' : 'No'
      }));
      
      return successResponse(res, {
        data: formattedInsurance,
        total: count,
        page: parseInt(page),
        totalPages: Math.ceil(count / limit)
      }, 'Insurance data fetched successfully');
      
    } catch (error) {
      return serverError(res, error);
    }
  }
  
  // Get low stock alerts
  async getLowStockAlerts(req, res) {
    try {
      const lowStockDrugs = await Drug.findAll({
        where: {
          currentQuantity: { [Op.lt]: 20 }
        },
        include: [{
          association: 'supplier',
          attributes: ['id', 'name', 'phone']
        }],
        order: [['currentQuantity', 'ASC']]
      });
      
      const formattedAlerts = lowStockDrugs.map(drug => ({
        drugId: drug.id,
        brandName: drug.brandName,
        genericName: drug.genericName,
        currentQuantity: drug.currentQuantity,
        minQuantity: drug.minQuantity,
        supplierName: drug.supplier?.name || 'Unknown',
        supplierPhone: drug.supplier?.phone || '',
        urgency: drug.currentQuantity < 10 ? 'critical' : drug.currentQuantity < 20 ? 'warning' : 'info'
      }));
      
      return successResponse(res, formattedAlerts, 'Low stock alerts fetched successfully');
      
    } catch (error) {
      return serverError(res, error);
    }
  }
  
  // Get expiry alerts
  async getExpiryAlerts(req, res) {
    try {
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      
      const expiringDrugs = await Drug.findAll({
        where: {
          expiryDate: {
            [Op.between]: [new Date(), thirtyDaysFromNow]
          }
        },
        order: [['expiryDate', 'ASC']]
      });
      
      const formattedAlerts = expiringDrugs.map(drug => ({
        drugId: drug.id,
        brandName: drug.brandName,
        genericName: drug.genericName,
        expiryDate: this.formatExpiryDate(drug.expiryDate),
        daysUntilExpiry: Math.ceil((new Date(drug.expiryDate) - new Date()) / (1000 * 60 * 60 * 24)),
        currentQuantity: drug.currentQuantity,
        urgency: (new Date(drug.expiryDate) - new Date()) / (1000 * 60 * 60 * 24) < 7 ? 'critical' : 'warning'
      }));
      
      return successResponse(res, formattedAlerts, 'Expiry alerts fetched successfully');
      
    } catch (error) {
      return serverError(res, error);
    }
  }
  
  // Helper methods
  formatDate(date) {
    if (!date) return '';
    const d = new Date(date);
    return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
  }
  
  formatExpiryDate(date) {
    if (!date) return '';
    const d = new Date(date);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[d.getMonth()];
    const year = d.getFullYear().toString().slice(-2);
    return `${month}-${year}`;
  }
  
  formatPrescriptionStatus(status) {
    const statusMap = {
      'pending': 'pending',
      'filled': 'filled',
      'picked_up': 'picked up',
      'cancelled': 'cancelled'
    };
    return statusMap[status] || status;
  }
}

module.exports = new InventoryController();