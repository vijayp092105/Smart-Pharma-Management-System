// server/src/controllers/uploadController.js
const fs = require('fs');
const path = require('path');
const { successResponse, errorResponse, serverError } = require('../utils/response');
const CSVParser = require('../utils/csvParser');
const upload = require('../utils/fileUpload'); // multer instance
const { Drug, Patient, Doctor, Supplier, Insurance, Prescription } = require('../models');

// Ensure upload path exists (fallback to ./uploads)
const UPLOAD_PATH = process.env.UPLOAD_PATH || path.resolve(process.cwd(), './uploads');
if (!fs.existsSync(UPLOAD_PATH)) fs.mkdirSync(UPLOAD_PATH, { recursive: true });

/**
 * Utility: normalize row keys
 * - trims keys
 * - removes BOM
 * - lowercases and replaces spaces/special chars with underscore
 */
function normalizeRow(row) {
  const normalized = {};
  for (const rawKey of Object.keys(row || {})) {
    const k = String(rawKey || '')
      .replace(/^\uFEFF/, '') // strip BOM
      .trim()
      .replace(/\s+/g, '_')   // spaces -> underscore
      .replace(/[^\w_]/g, '') // remove non-word except underscore
      .toLowerCase();
    normalized[k] = row[rawKey];
  }
  return normalized;
}

/**
 * Safely parse integer
 */
function safeInt(v, fallback = 0) {
  if (v === null || v === undefined || v === '') return fallback;
  const n = parseInt(String(v).replace(/[^\d\-]/g, ''), 10);
  return Number.isNaN(n) ? fallback : n;
}

/**
 * Safely parse float
 */
function safeFloat(v, fallback = 0.0) {
  if (v === null || v === undefined || v === '') return fallback;
  const n = parseFloat(String(v).replace(/[^0-9.\-]/g, ''));
  return Number.isNaN(n) ? fallback : n;
}

class UploadController {
  // Handle file upload - accepts multiple files under form-name "file"
  async uploadFile(req, res) {
    try {
      // Use multer instance directly and accept multiple files
      upload.any()(req, res, async (err) => {
        if (err) {
          console.error('Upload middleware error:', err);
          return errorResponse(res, err.message || 'File upload failed', 400);
        }

        const files = req.files || [];
        if (!files.length) {
          return errorResponse(res, 'No files uploaded. Use multipart/form-data with field name "file".', 400);
        }

        const datasetTypeFromBody = (req.body?.datasetType || req.body?.dataset || 'auto').toString().toLowerCase();
        const processedResults = [];

        for (const file of files) {
          const filePath = file.path || file.location || path.join(UPLOAD_PATH, file.filename || file.originalname);
          try {
            // parse file
            const rawData = await CSVParser.parseFile(filePath);

            if (!rawData || !Array.isArray(rawData) || rawData.length === 0) {
              processedResults.push({
                originalName: file.originalname,
                savedAs: path.basename(filePath),
                rowsProcessed: 0,
                success: false,
                message: 'File empty or could not be parsed'
              });
              // cleanup
              try { if (fs.existsSync(filePath)) fs.unlinkSync(filePath); } catch(e){ console.warn('cleanup failed', e.message); }
              continue;
            }

            // Normalize keys for all rows
            const data = rawData.map(r => normalizeRow(r));

            // Detect dataset type (CSVParser.detectDatasetType expects raw keys; our normalize makes keys lowercase/underscored)
            const detectedType = (datasetTypeFromBody === 'auto')
              ? (CSVParser.detectDatasetType(data) || 'unknown')
              : datasetTypeFromBody;

            // Process data, each processor returns { inserted, message } or throws
            let result = { inserted: 0, message: 'No action' };
            switch (detectedType) {
              case 'patients':
                result = await this.processPatients(data);
                break;
              case 'doctors':
                result = await this.processDoctors(data);
                break;
              case 'drugs':
                result = await this.processDrugs(data);
                break;
              case 'suppliers':
              case 'supplier':
                result = await this.processSuppliers(data);
                break;
              case 'prescriptions':
                result = await this.processPrescriptions(data);
                break;
              case 'insurance':
                result = await this.processInsurance(data);
                break;
              default:
                result = { inserted: 0, message: `Could not detect dataset type for ${file.originalname}. Detected: ${detectedType}` };
                break;
            }

            // cleanup uploaded file
            try { if (fs.existsSync(filePath)) fs.unlinkSync(filePath); } catch(e){ console.warn('Cleanup failed', e.message); }

            processedResults.push({
              originalName: file.originalname,
              savedAs: path.basename(filePath),
              datasetType: detectedType,
              rowsProcessed: Array.isArray(data) ? data.length : 0,
              success: true,
              ...result
            });
          } catch (fileErr) {
            console.error(`Processing failed for ${file.originalname}:`, fileErr);
            // attempt cleanup
            try { if (fs.existsSync(filePath)) fs.unlinkSync(filePath); } catch(e){}

            processedResults.push({
              originalName: file.originalname,
              savedAs: path.basename(filePath),
              rowsProcessed: 0,
              success: false,
              message: 'Processing error',
              error: fileErr.message || String(fileErr)
            });
          }
        }

        return successResponse(res, { files: processedResults }, 'Files uploaded and processed (per-file results included)');
      });
    } catch (error) {
      return serverError(res, error);
    }
  }

  // ---- Processing helpers (use normalized keys) ----

  async processPatients(data) {
    try {
      const patients = data.map(row => {
        // normalized keys are lowercase underscored
        const birth = row.birthdate || row.dob || null;
        let birthdate = null;
        if (birth) {
          const v = String(birth);
          // Try common formats
          const ymd = v.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
          const dmy = v.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
          if (ymd) birthdate = `${ymd[1]}-${String(ymd[2]).padStart(2,'0')}-${String(ymd[3]).padStart(2,'0')}`;
          else if (dmy) {
            // assume m/d/yyyy or d/m/yyyy — try detect
            const a = parseInt(dmy[1],10), b = parseInt(dmy[2],10), c = parseInt(dmy[3],10);
            // heuristic: if first > 12 assume d/m/y else m/d/y
            if (a > 12) birthdate = `${c}-${String(b).padStart(2,'0')}-${String(a).padStart(2,'0')}`;
            else birthdate = `${c}-${String(a).padStart(2,'0')}-${String(b).padStart(2,'0')}`;
          }
        }

        return {
          patientId: safeInt(row.patientid ?? row.patient_id ?? row.patientidnumber ?? row.patientidnumber),
          firstName: row.firstname ?? row.first_name ?? row.first,
          lastName: row.lastname ?? row.last_name ?? row.last,
          birthdate,
          address: row.address,
          phone: row.phone,
          gender: row.gender,
          insurance: row.insurance
        };
      }).filter(p => p.patientId > 0);

      if (!patients.length) return { inserted: 0, message: 'No valid patient rows found' };

      const result = await Patient.bulkCreate(patients, {
        updateOnDuplicate: ['firstName', 'lastName', 'birthdate', 'address', 'phone', 'gender', 'insurance']
      });

      return { inserted: Array.isArray(result) ? result.length : result, message: `${Array.isArray(result) ? result.length : result} patients processed` };
    } catch (err) {
      console.error('processPatients error:', err);
      return { inserted: 0, message: 'Failed to process patients', error: err.message || String(err) };
    }
  }

  async processDoctors(data) {
    try {
      const doctors = data.map(row => ({
        physId: safeInt(row.physid ?? row.phys_id),
        name: row.name ?? `${row.first_name ?? ''} ${row.last_name ?? ''}`.trim(),
        address: row.address,
        phone: row.phone
      })).filter(d => d.physId > 0);

      if (!doctors.length) return { inserted: 0, message: 'No valid doctor rows found' };

      const result = await Doctor.bulkCreate(doctors, {
        updateOnDuplicate: ['name', 'address', 'phone']
      });

      return { inserted: Array.isArray(result) ? result.length : result, message: `${Array.isArray(result) ? result.length : result} doctors processed` };
    } catch (err) {
      console.error('processDoctors error:', err);
      return { inserted: 0, message: 'Failed to process doctors', error: err.message || String(err) };
    }
  }

  async processDrugs(data) {
    try {
      // create supplier map using supplier.sup_id or supplier.supid etc
      const suppliers = await Supplier.findAll();
      const supplierMap = {};
      suppliers.forEach(s => { supplierMap[s.supId ?? s.sup_id ?? s.id] = s.id; });

      const monthMap = {
        'jan': '01','feb':'02','mar':'03','apr':'04','may':'05','jun':'06',
        'jul':'07','aug':'08','sep':'09','oct':'10','nov':'11','dec':'12'
      };

      const drugs = data.map(row => {
        const expRaw = row.expdate ?? row.exp_date ?? row.expirydate ?? row.expiry_date ?? '';
        let expiryDate = null;
        if (expRaw && typeof expRaw === 'string' && expRaw.includes('-')) {
          const parts = expRaw.split('-');
          const mon = (parts[0] || '').toLowerCase();
          const yr = (parts[1] || '');
          const mm = monthMap[mon] || (mon.padStart ? mon.padStart(2, '0') : '01');
          const fullYear = (yr.length === 2) ? `20${yr}` : yr;
          try {
            const lastDay = new Date(parseInt(fullYear), parseInt(mm), 0).getDate();
            expiryDate = `${fullYear}-${mm}-${String(lastDay).padStart(2,'0')}`;
          } catch (e) {
            expiryDate = null;
          }
        }

        // supplier id detection: supid, supplierid, sup_id
        const supKey = safeInt(row.supid ?? row.supplierid ?? row.supplier_id ?? row.sup_id);
        const supplierId = supplierMap[supKey] || null;

        return {
          ndc: String(row.ndc ?? row.ndc_code ?? row.code ?? '').trim(),
          brandName: row.brandname ?? row.brand_name ?? row.brand,
          genericName: row.genericname ?? row.generic_name ?? row.generic,
          dosage: row.dosage,
          expiryDate,
          supplierId,
          purchasePrice: safeFloat(row.purchaseprice ?? row.purchase_price ?? row.purchase),
          sellingPrice: safeFloat(row.sellingprice ?? row.selling_price ?? row.sell),
          currentQuantity: safeInt(row.currentquantity ?? row.current_quantity ?? row.quantity),
          minQuantity: safeInt(row.minquantity ?? row.min_quantity),
          maxQuantity: safeInt(row.maxquantity ?? row.max_quantity)
        };
      }).filter(d => d.ndc && d.brandName);

      if (!drugs.length) return { inserted: 0, message: 'No valid drug rows found' };

      const result = await Drug.bulkCreate(drugs, {
        updateOnDuplicate: ['brandName','genericName','dosage','expiryDate','supplierId','purchasePrice','sellingPrice','currentQuantity','minQuantity','maxQuantity']
      });

      return { inserted: Array.isArray(result) ? result.length : result, message: `${Array.isArray(result) ? result.length : result} drugs processed` };
    } catch (err) {
      console.error('processDrugs error:', err);
      return { inserted: 0, message: 'Failed to process drugs', error: err.message || String(err) };
    }
  }

  async processSuppliers(data) {
    try {
      const suppliers = data.map(row => ({
        supId: safeInt(row.supid ?? row.sup_id ?? row.supplierid),
        name: row.name ?? '',
        address: row.address ?? '',
        phone: row.phone ?? ''
      })).filter(s => s.supId > 0);

      if (!suppliers.length) return { inserted: 0, message: 'No valid supplier rows found' };

      const result = await Supplier.bulkCreate(suppliers, {
        updateOnDuplicate: ['name','address','phone']
      });

      return { inserted: Array.isArray(result) ? result.length : result, message: `${Array.isArray(result) ? result.length : result} suppliers processed` };
    } catch (err) {
      console.error('processSuppliers error:', err);
      return { inserted: 0, message: 'Failed to process suppliers', error: err.message || String(err) };
    }
  }

  async processPrescriptions(data) {
    try {
      // maps for fk resolution
      const patients = await Patient.findAll();
      const doctors = await Doctor.findAll();
      const drugs = await Drug.findAll();

      const patientMap = {}; patients.forEach(p => { patientMap[p.patientId ?? p.patient_id] = p.id; });
      const doctorMap = {}; doctors.forEach(d => { doctorMap[d.physId ?? d.phys_id] = d.id; });
      const drugMap = {}; drugs.forEach(d => { drugMap[d.ndc] = d.id; });

      const prescriptions = data.map(row => {
        const statusRaw = (row.status || '').toString().toLowerCase();
        let status = 'pending';
        if (statusRaw.includes('picked')) status = 'picked_up';
        if (statusRaw.includes('filled')) status = 'filled';

        return {
          patientId: patientMap[safeInt(row.patientid)] || null,
          doctorId: doctorMap[safeInt(row.physid)] || null,
          drugId: drugMap[String(row.ndc ?? '')] || null,
          quantity: safeInt(row.qty ?? row.quantity),
          daysSupply: safeInt(row.days ?? row.days_supply),
          refills: safeInt(row.refills),
          status,
          filledDate: (status === 'filled' || status === 'picked_up') ? (new Date().toISOString().split('T')[0]) : null
        };
      }).filter(p => p.patientId && p.doctorId && p.drugId);

      if (!prescriptions.length) return { inserted: 0, message: 'No valid prescription rows found' };

      const result = await Prescription.bulkCreate(prescriptions, {
        updateOnDuplicate: ['quantity','daysSupply','refills','status','filledDate']
      });

      return { inserted: Array.isArray(result) ? result.length : result, message: `${Array.isArray(result) ? result.length : result} prescriptions processed` };
    } catch (err) {
      console.error('processPrescriptions error:', err);
      return { inserted: 0, message: 'Failed to process prescriptions', error: err.message || String(err) };
    }
  }

  async processInsurance(data) {
    try {
      const insurance = data.map(row => ({
        name: row.name ?? '',
        phone: row.phone ?? '',
        coPay: ((String(row.copay ?? row.co_pay ?? 'no')).toLowerCase() === 'yes')
      })).filter(i => i.name);

      if (!insurance.length) return { inserted: 0, message: 'No valid insurance rows found' };

      const result = await Insurance.bulkCreate(insurance, {
        updateOnDuplicate: ['phone','coPay']
      });

      return { inserted: Array.isArray(result) ? result.length : result, message: `${Array.isArray(result) ? result.length : result} insurance records processed` };
    } catch (err) {
      console.error('processInsurance error:', err);
      return { inserted: 0, message: 'Failed to process insurance', error: err.message || String(err) };
    }
  }

  // Optional: upload history (mock)
  async getUploadHistory(req, res) {
    try {
      const history = [
        { id: 1, fileName: 'patients_import.csv', datasetType: 'patients', rowsProcessed: 14, status: 'success', uploadedAt: new Date(Date.now() - 86400000).toISOString() },
        { id: 2, fileName: 'drugs_update.xlsx', datasetType: 'drugs', rowsProcessed: 25, status: 'success', uploadedAt: new Date(Date.now() - 172800000).toISOString() }
      ];
      return successResponse(res, history, 'Upload history fetched successfully');
    } catch (error) {
      return serverError(res, error);
    }
  }
}

module.exports = new UploadController();
