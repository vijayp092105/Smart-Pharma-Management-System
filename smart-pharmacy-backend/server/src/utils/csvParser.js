const csv = require('csv-parser');
const fs = require('fs');
const xlsx = require('xlsx');
const path = require('path');

class CSVParser {
  static async parseFile(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    
    if (ext === '.csv') {
      return await this.parseCSV(filePath);
    } else if (ext === '.xlsx' || ext === '.xls') {
      return await this.parseExcel(filePath);
    } else {
      throw new Error('Unsupported file format');
    }
  }
  
  static parseCSV(filePath) {
    return new Promise((resolve, reject) => {
      const results = [];
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', () => resolve(results))
        .on('error', reject);
    });
  }
  
  static parseExcel(filePath) {
    try {
      const workbook = xlsx.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = xlsx.utils.sheet_to_json(worksheet);
      return data;
    } catch (error) {
      throw new Error(`Excel parsing error: ${error.message}`);
    }
  }
  
  static detectDatasetType(data) {
    if (!data || data.length === 0) return 'unknown';
    
    const firstRow = data[0];
    const columns = Object.keys(firstRow).map(k => k.toLowerCase());
    
    // Check for patient columns
    const patientCols = ['firstname', 'lastname', 'patientid', 'birthdate', 'insurance'];
    if (patientCols.some(col => columns.includes(col))) return 'patients';
    
    // Check for doctor columns
    const doctorCols = ['physid', 'name', 'phone'];
    if (doctorCols.some(col => columns.includes(col))) return 'doctors';
    
    // Check for drug columns
    const drugCols = ['ndc', 'brandname', 'genericname', 'expdate', 'supplierid'];
    if (drugCols.some(col => columns.includes(col))) return 'drugs';
    
    // Check for prescription columns
    const prescriptionCols = ['patientid', 'physid', 'ndc', 'qty', 'refills'];
    if (prescriptionCols.some(col => columns.includes(col))) return 'prescriptions';
    
    // Check for supplier columns
    const supplierCols = ['supid', 'name', 'address'];
    if (supplierCols.some(col => columns.includes(col))) return 'suppliers';
    
    // Check for insurance columns
    const insuranceCols = ['name', 'phone', 'copay'];
    if (insuranceCols.some(col => columns.includes(col))) return 'insurance';
    
    return 'unknown';
  }
}

module.exports = CSVParser;