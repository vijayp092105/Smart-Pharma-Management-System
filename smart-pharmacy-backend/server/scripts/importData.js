const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const { sequelize } = require('../src/config/database');
const {
  Patient,
  Doctor,
  Supplier,
  Insurance,
  Drug,
  Prescription,
  AlertHistory,
  ChatHistory,
  SalesTransaction
} = require('../src/models');

async function importCSVData() {
  console.log('🔄 Starting CSV data import...');
  
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connected');
    
    // Clear existing data in correct order (due to foreign keys)
    console.log('🧹 Clearing existing data in correct order...');
    await SalesTransaction.destroy({ where: {} });
    await AlertHistory.destroy({ where: {} });
    await ChatHistory.destroy({ where: {} });
    await Prescription.destroy({ where: {} });
    await Drug.destroy({ where: {} });
    await Insurance.destroy({ where: {} });
    await Supplier.destroy({ where: {} });
    await Doctor.destroy({ where: {} });
    await Patient.destroy({ where: {} });
    console.log('✅ All existing data cleared');
    
    // Parse date from MM/YY format to YYYY-MM-DD
    function parseDateMMYY(dateStr) {
      if (!dateStr || dateStr.trim() === '') {
        return '2025-12-31'; // Default future date
      }
      
      dateStr = dateStr.trim();
      
      // Handle MM/YY format (like "12/24")
      if (dateStr.includes('/')) {
        const [month, year] = dateStr.split('/');
        
        if (month && year) {
          const monthNum = month.padStart(2, '0');
          let fullYear;
          
          // Convert 2-digit year to 4-digit
          if (year.length === 2) {
            const yearNum = parseInt(year);
            // If year is less than 50, assume 2000s, otherwise 1900s
            fullYear = yearNum < 50 ? `20${year}` : `19${year}`;
          } else {
            fullYear = year;
          }
          
          // Return 15th of month as a safe middle date
          return `${fullYear}-${monthNum}-15`;
        }
      }
      
      // Default future date if parsing fails
      console.log(`⚠️ Could not parse date: "${dateStr}", using default`);
      return '2025-12-31';
    }
    
    // Parse patient birthdate (from MM/DD/YYYY)
    function parseBirthdate(dateStr) {
      if (!dateStr || dateStr.trim() === '') {
        return null;
      }
      
      dateStr = dateStr.trim();
      
      // Handle MM/DD/YYYY format
      if (dateStr.includes('/')) {
        const [month, day, year] = dateStr.split('/');
        if (month && day && year) {
          return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        }
      }
      
      // Handle DD-MM-YYYY format
      if (dateStr.includes('-')) {
        const [day, month, year] = dateStr.split('-');
        if (day && month && year) {
          return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        }
      }
      
      return null;
    }
    
    // ========== IMPORT SUPPLIERS FIRST (for foreign key) ==========
    console.log('\n🏢 Importing suppliers...');
    const suppliers = [];
    await new Promise((resolve, reject) => {
      fs.createReadStream(path.join(__dirname, '../../database/seed_data/SUPPLIER.csv'))
        .pipe(csv())
        .on('data', (row) => {
          suppliers.push({
            supId: parseInt(row.supID),
            name: row.name,
            address: row.address,
            phone: row.phone
          });
        })
        .on('end', resolve)
        .on('error', reject);
    });
    
    const createdSuppliers = await Supplier.bulkCreate(suppliers);
    console.log(`✅ Imported ${createdSuppliers.length} suppliers`);
    
    // Create mapping: sup_id (from CSV) -> database id
    const supplierMap = {};
    createdSuppliers.forEach(supplier => {
      supplierMap[supplier.supId] = supplier.id;
    });
    
    console.log('📊 Supplier ID mapping:');
    Object.entries(supplierMap).forEach(([supId, dbId]) => {
      console.log(`   CSV supID ${supId} -> Database ID ${dbId}`);
    });
    
    // ========== IMPORT INSURANCE ==========
    console.log('\n🛡️ Importing insurance...');
    const insurance = [];
    await new Promise((resolve, reject) => {
      fs.createReadStream(path.join(__dirname, '../../database/seed_data/INSURANCE.csv'))
        .pipe(csv())
        .on('data', (row) => {
          insurance.push({
            name: row.name,
            phone: row.phone,
            coPay: row.coPay === 'Yes'
          });
        })
        .on('end', resolve)
        .on('error', reject);
    });
    
    await Insurance.bulkCreate(insurance);
    console.log(`✅ Imported ${insurance.length} insurance companies`);
    
    // ========== IMPORT PATIENTS ==========
    console.log('\n📋 Importing patients...');
    const patients = [];
    await new Promise((resolve, reject) => {
      fs.createReadStream(path.join(__dirname, '../../database/seed_data/PATIENT1(1).csv'))
        .pipe(csv())
        .on('data', (row) => {
          patients.push({
            patientId: parseInt(row.patientID),
            firstName: row.firstName,
            lastName: row.lastName,
            birthdate: parseBirthdate(row.birthdate),
            address: row.address,
            phone: row.phone,
            gender: row.gender || null,
            insurance: row.insurance || null
          });
        })
        .on('end', resolve)
        .on('error', reject);
    });
    
    await Patient.bulkCreate(patients);
    console.log(`✅ Imported ${patients.length} patients`);
    
    // ========== IMPORT DOCTORS ==========
    console.log('\n👨‍⚕️ Importing doctors...');
    const doctors = [];
    await new Promise((resolve, reject) => {
      fs.createReadStream(path.join(__dirname, '../../database/seed_data/DOCTOR1(1).csv'))
        .pipe(csv())
        .on('data', (row) => {
          doctors.push({
            physId: parseInt(row.physID),
            name: row.name,
            address: row.address,
            phone: row.phone
          });
        })
        .on('end', resolve)
        .on('error', reject);
    });
    
    await Doctor.bulkCreate(doctors);
    console.log(`✅ Imported ${doctors.length} doctors`);
    
    // ========== IMPORT DRUGS (with proper SUPPLIER ID MAPPING) ==========
    console.log('\n💊 Importing drugs...');
    const drugs = [];
    let drugRowCount = 0;
    await new Promise((resolve, reject) => {
      fs.createReadStream(path.join(__dirname, '../../database/seed_data/DRUGS.csv'))
        .pipe(csv())
        .on('data', (row) => {
          drugRowCount++;
          
          // Get CSV supID
          const csvSupId = parseInt(row.supID);
          
          // Map to database ID using supplierMap
          const databaseSupplierId = supplierMap[csvSupId];
          
          if (!databaseSupplierId) {
            console.log(`❌ ERROR: No database ID found for supID ${csvSupId} for drug ${row.brandName}`);
            return; // Skip this drug
          }
          
          // Parse expiry date from MM/YY format
          const expiryDate = parseDateMMYY(row.expDate);
          
          // DEBUG: Show first 5 rows
          if (drugRowCount <= 5) {
            console.log(`   Sample: ${row.brandName} - CSV supID: ${csvSupId} -> DB ID: ${databaseSupplierId}, Exp: "${row.expDate}" -> ${expiryDate}`);
          }
          
          drugs.push({
            ndc: row.NDC,
            brandName: row.brandName,
            genericName: row.genericName,
            dosage: row.dosage,
            expiryDate: expiryDate,
            supplierId: databaseSupplierId, // Use MAPPED database ID
            purchasePrice: parseFloat(row.purchasePrice),
            sellingPrice: parseFloat(row.sellPrice),
            currentQuantity: Math.floor(Math.random() * 200) + 30,
            minQuantity: 20,
            maxQuantity: 500
          });
        })
        .on('end', resolve)
        .on('error', reject);
    });
    
    // Filter out any drugs that failed mapping
    const validDrugs = drugs.filter(drug => drug.supplierId);
    
    if (validDrugs.length < drugs.length) {
      console.log(`⚠️ Warning: ${drugs.length - validDrugs.length} drugs skipped due to supplier mapping issues`);
    }
    
    await Drug.bulkCreate(validDrugs);
    console.log(`✅ Imported ${validDrugs.length} drugs`);
    
    // ========== IMPORT PRESCRIPTIONS ==========
    console.log('\n📋 Importing prescriptions...');
    const prescriptions = [];
    
    // Get drug mapping for NDC to ID
    const allDrugs = await Drug.findAll();
    const drugMap = {};
    allDrugs.forEach(drug => {
      drugMap[drug.ndc] = drug.id;
    });
    
    // Get patient mapping for patientID to database ID
    const allPatients = await Patient.findAll();
    const patientMap = {};
    allPatients.forEach(patient => {
      patientMap[patient.patientId] = patient.id;
    });
    
    // Get doctor mapping for physID to database ID
    const allDoctors = await Doctor.findAll();
    const doctorMap = {};
    allDoctors.forEach(doctor => {
      doctorMap[doctor.physId] = doctor.id;
    });
    
    await new Promise((resolve, reject) => {
      fs.createReadStream(path.join(__dirname, '../../database/seed_data/PRESCRIPTIONS.csv'))
        .pipe(csv())
        .on('data', (row) => {
          const drugId = drugMap[row.NDC];
          const patientDbId = patientMap[parseInt(row.patientID)];
          const doctorDbId = doctorMap[parseInt(row.physID)];
          
          if (!drugId) {
            console.log(`⚠️ Skipping prescription: Drug NDC ${row.NDC} not found in database`);
            return;
          }
          
          if (!patientDbId) {
            console.log(`⚠️ Skipping prescription: Patient ID ${row.patientID} not found in database`);
            return;
          }
          
          if (!doctorDbId) {
            console.log(`⚠️ Skipping prescription: Doctor ID ${row.physID} not found in database`);
            return;
          }
          
          // Convert status
          let status = 'pending';
          if (row.status === 'picked up') status = 'picked_up';
          if (row.status === 'filled') status = 'filled';
          
          prescriptions.push({
            patientId: patientDbId, // Use mapped database ID
            doctorId: doctorDbId,   // Use mapped database ID
            drugId: drugId,
            quantity: parseInt(row.qty),
            daysSupply: parseInt(row.days),
            refills: parseInt(row.refills),
            status: status,
            filledDate: status !== 'pending' ? '2024-01-15' : null
          });
        })
        .on('end', resolve)
        .on('error', reject);
    });
    
    await Prescription.bulkCreate(prescriptions);
    console.log(`✅ Imported ${prescriptions.length} prescriptions`);
    
    // ========== CREATE SALES TRANSACTIONS ==========
    console.log('\n💰 Creating sales transactions...');
    const sales = [];
    
    // Get filled prescriptions for sales
    const filledPrescriptions = await Prescription.findAll({
      where: { status: ['filled', 'picked_up'] },
      include: [{ model: Drug, as: 'drug' }]
    });
    
    for (const prescription of filledPrescriptions) {
      if (prescription.drug) {
        sales.push({
          drugId: prescription.drugId,
          prescriptionId: prescription.id,
          quantitySold: prescription.quantity,
          saleAmount: prescription.quantity * prescription.drug.sellingPrice,
          transactionDate: prescription.filledDate || '2024-01-15'
        });
      }
    }
    
    // Add historical sales for forecasting (past 12 months)
    const today = new Date();
    const startDate = new Date(today);
    startDate.setMonth(startDate.getMonth() - 12);
    
    for (let i = 0; i < 50; i++) {
      const randomDrug = allDrugs[Math.floor(Math.random() * allDrugs.length)];
      const saleDate = new Date(startDate);
      saleDate.setDate(saleDate.getDate() + Math.floor(Math.random() * 365));
      
      sales.push({
        drugId: randomDrug.id,
        prescriptionId: null,
        quantitySold: Math.floor(Math.random() * 5) + 1,
        saleAmount: (Math.floor(Math.random() * 5) + 1) * randomDrug.sellingPrice,
        transactionDate: saleDate.toISOString().split('T')[0]
      });
    }
    
    await SalesTransaction.bulkCreate(sales);
    console.log(`✅ Created ${sales.length} sales transactions`);
    
    // ========== CREATE SAMPLE ALERTS ==========
    console.log('\n⚠️ Creating sample alerts...');
    
    // Check for low stock drugs
    const lowStockDrugs = await Drug.findAll({
      where: {
        currentQuantity: { [sequelize.Sequelize.Op.lt]: 30 }
      },
      limit: 5
    });
    
    const alerts = [];
    for (const drug of lowStockDrugs) {
      alerts.push({
        alertType: 'low_stock',
        drugId: drug.id,
        message: `Low stock alert: ${drug.brandName} has only ${drug.currentQuantity} units left (min: ${drug.minQuantity})`,
        severity: 'warning',
        sentToTelegram: false,
        resolved: false
      });
    }
    
    // Check for expiring drugs (next 60 days)
    const sixtyDaysFromNow = new Date();
    sixtyDaysFromNow.setDate(sixtyDaysFromNow.getDate() + 60);
    
    const expiringDrugs = await Drug.findAll({
      where: {
        expiryDate: {
          [sequelize.Sequelize.Op.between]: [new Date(), sixtyDaysFromNow]
        }
      },
      limit: 5
    });
    
    for (const drug of expiringDrugs) {
      alerts.push({
        alertType: 'expiry_warning',
        drugId: drug.id,
        message: `Expiry warning: ${drug.brandName} expires on ${drug.expiryDate}`,
        severity: 'warning',
        sentToTelegram: false,
        resolved: false
      });
    }
    
    await AlertHistory.bulkCreate(alerts);
    console.log(`✅ Created ${alerts.length} sample alerts`);
    
    console.log('\n' + '='.repeat(50));
    console.log('🎉 DATA IMPORT COMPLETED SUCCESSFULLY!');
    console.log('='.repeat(50));
    console.log('\n📊 FINAL SUMMARY:');
    console.log(`   📋 Patients: ${patients.length}`);
    console.log(`   👨‍⚕️ Doctors: ${doctors.length}`);
    console.log(`   🏢 Suppliers: ${createdSuppliers.length}`);
    console.log(`   🛡️ Insurance: ${insurance.length}`);
    console.log(`   💊 Drugs: ${validDrugs.length}`);
    console.log(`   📋 Prescriptions: ${prescriptions.length}`);
    console.log(`   💰 Sales Transactions: ${sales.length}`);
    console.log(`   ⚠️ Alerts: ${alerts.length}`);
    console.log('\n✅ Database is ready for use!');
    
  } catch (error) {
    console.error('\n❌ Data import failed:', error.message);
    console.error('Error details:', error);
    
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

// Run if this script is executed directly
if (require.main === module) {
  importCSVData();
}

module.exports = importCSVData;