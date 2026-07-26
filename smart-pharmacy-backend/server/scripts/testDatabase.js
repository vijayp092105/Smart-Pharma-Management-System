const { sequelize } = require('../src/config/database');
const { Op } = require('sequelize');  // ✅ add this
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

async function testDatabase() {
  console.log('🧪 Testing database connection and data...\n');
  
  try {
    // Test connection
    await sequelize.authenticate();
    console.log('✅ Database connection: PASS');
    
    // Test counts
    const patientCount = await Patient.count();
    const doctorCount = await Doctor.count();
    const supplierCount = await Supplier.count();
    const insuranceCount = await Insurance.count();
    const drugCount = await Drug.count();
    const prescriptionCount = await Prescription.count();
    const salesCount = await SalesTransaction.count();
    
    console.log(`\n📊 Data Counts:`);
    console.log(`   Patients: ${patientCount} ${patientCount > 0 ? '✅' : '❌'}`);
    console.log(`   Doctors: ${doctorCount} ${doctorCount > 0 ? '✅' : '❌'}`);
    console.log(`   Suppliers: ${supplierCount} ${supplierCount > 0 ? '✅' : '❌'}`);
    console.log(`   Insurance: ${insuranceCount} ${insuranceCount > 0 ? '✅' : '❌'}`);
    console.log(`   Drugs: ${drugCount} ${drugCount > 0 ? '✅' : '❌'}`);
    console.log(`   Prescriptions: ${prescriptionCount} ${prescriptionCount > 0 ? '✅' : '❌'}`);
    console.log(`   Sales Transactions: ${salesCount} ${salesCount > 0 ? '✅' : '❌'}`);
    
    // Sample queries
    console.log('\n🔍 Sample Data:');
    
    // 💊 Low stock drugs
    const lowStockDrugs = await Drug.findAll({
      where: { currentQuantity: { [Op.lt]: 30 } },   // ✅ use Op.lt
      limit: 3
    });
    console.log(`\n💊 Low stock drugs (<30 units): ${lowStockDrugs.length} found`);
    lowStockDrugs.forEach(drug => {
      console.log(`   - ${drug.brandName}: ${drug.currentQuantity} units`);
    });
    
    // ⚠️ Expiring drugs in next 30 days
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    
    const expiringDrugs = await Drug.findAll({
      where: {
        expiryDate: {
          [Op.lt]: thirtyDaysFromNow,  // ✅ use Op.lt
          [Op.gt]: new Date()          // ✅ use Op.gt
        }
      },
      limit: 3
    });
    console.log(`\n⚠️ Expiring drugs (next 30 days): ${expiringDrugs.length} found`);
    expiringDrugs.forEach(drug => {
      console.log(`   - ${drug.brandName}: expires ${drug.expiryDate}`);
    });
    
    // 💰 Recent sales
    const recentSales = await SalesTransaction.findAll({
      order: [['transactionDate', 'DESC']],
      limit: 3,
      include: [{ model: Drug, as: 'drug' }]
    });
    console.log(`\n💰 Recent sales:`);
    recentSales.forEach(sale => {
      console.log(`   - ${sale.drug?.brandName}: ${sale.quantitySold} units, $${sale.saleAmount}`);
    });
    
    console.log('\n🎉 All database tests passed!');
    
  } catch (error) {
    console.error('❌ Database test failed:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

// Run if this script is executed directly
if (require.main === module) {
  testDatabase();
}

module.exports = testDatabase;
