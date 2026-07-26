// Patients Table
export const PATIENTS = [
  { firstName: 'James', lastName: 'Smith', birthdate: '01-01-1987', address: '652 Jill Dr.', phone: '(868)456-9876', gender: 'M', insurance: 'Molina', patientID: 1 },
  { firstName: 'Huda', lastName: 'Saleh', birthdate: '22-09-1999', address: '347 Moss Rd.', phone: '(313)459-9226', gender: 'F', insurance: 'Alliance', patientID: 2 },
  { firstName: 'Rachel', lastName: 'Wilson', birthdate: '22-10-1990', address: '210 Fork St.', phone: '(313)654-0989', gender: 'F', insurance: '', patientID: 3 },
  { firstName: 'Ali', lastName: 'Hamade', birthdate: '31-12-2001', address: '410 John R. St.', phone: '(564)879-7623', gender: 'M', insurance: 'BlueCross', patientID: 4 },
  { firstName: 'Mona', lastName: 'Berry', birthdate: '23-04-2009', address: '354 Colson Ave.', phone: '(313)768-6543', gender: 'F', insurance: 'PriorityHealth', patientID: 5 },
  { firstName: 'Jordan', lastName: 'Parker', birthdate: '05-09-1994', address: '457 Lilly Ln.', phone: '(678)876-4512', gender: '', insurance: 'BlueCross', patientID: 6 },
  { firstName: 'Milly', lastName: 'Roger', birthdate: '11-12-1950', address: '567 Holli St.', phone: '(678)987-1234', gender: 'F', insurance: 'Molina', patientID: 7 },
  { firstName: 'Mohammad', lastName: 'Musa', birthdate: '10-10-2010', address: '100 Cherry Ln.', phone: '(878)546-0980', gender: 'M', insurance: '', patientID: 9 },
  { firstName: 'Linda', lastName: 'Malek', birthdate: '08-07-1997', address: '345 Rubard Dr.', phone: '(878)456-0989', gender: '', insurance: 'Meridian', patientID: 10 },
  { firstName: 'Mark', lastName: 'Garcia', birthdate: '09-06-1954', address: '675 Helen Rd.', phone: '(613)765-0989', gender: 'M', insurance: 'BlueShield', patientID: 11 },
  { firstName: 'Fatema', lastName: 'Almo', birthdate: '08-06-2004', address: '768 Castle Cir.', phone: '(313)712-0908', gender: 'F', insurance: 'Molina', patientID: 13 },
  { firstName: 'Avery', lastName: 'Brandon', birthdate: '14-02-1955', address: '569 Forrest Ln.', phone: '(134)786-6654', gender: '', insurance: 'PriorityHealth', patientID: 14 },
  { firstName: 'Jose', lastName: 'Martinez', birthdate: '19-01-1988', address: '555 Morris Rd.', phone: '(976)821-0090', gender: 'M', insurance: '', patientID: 15 },
  { firstName: 'Rose', lastName: 'Johns', birthdate: '09-05-2000', address: '897 Mallory Dr.', phone: '(456)897-0908', gender: 'F', insurance: 'Molina', patientID: 16 },
];

// Doctors Table
export const DOCTORS = [
  { physID: 1, name: 'Robert Hong', address: '30055 Northwestern Hwy #101', phone: '(248)865-4444' },
  { physID: 2, name: 'Sarsam Muther', address: '6840 Greenfield Rd', phone: '(313)846-1700' },
  { physID: 3, name: 'Thikra Hussein', address: '6840 Greenfield Rd', phone: '(789)234-0768' },
  { physID: 4, name: 'Raad Alsaraf', address: '6840 Greenfield Rd', phone: '(313)846-1700' },
  { physID: 5, name: 'Sundus Jabro', address: '6840 Greenfield Rd', phone: '(313)678-5434' },
  { physID: 6, name: 'Jonathon State', address: '19401 Hubbard Dr', phone: '(313)982-4400' },
  { physID: 7, name: 'Gupta Madhu', address: '2021 Monroe St', phone: '(313)565-8700' },
  { physID: 8, name: 'Zakaria Fayda', address: '1711 Monroe St', phone: '(313)562-9100' },
  { physID: 9, name: 'Shirley Tom', address: '17000 Hubbard Dr', phone: '(313)982-4351' },
];

// Drugs Table
export const DRUGS = [
  { brandName: 'Aldactone', genericName: 'sprinolactone', NDC: '12365', dosage: '25', expDate: 'Dec-24', supID: 1, purchasePrice: 14.56, sellPrice: 17.88 },
  { brandName: 'Amoxil', genericName: 'amoxicillin', NDC: '17863', dosage: '50', expDate: 'Dec-25', supID: 1, purchasePrice: 12.34, sellPrice: 15.99 },
  { brandName: 'Glucotrol', genericName: 'glipizide', NDC: '23123', dosage: '50', expDate: 'Nov-23', supID: 1, purchasePrice: 9.45, sellPrice: 10.55 },
  { brandName: 'Motrin', genericName: 'ibuprophen', NDC: '23127', dosage: '80', expDate: 'Sep-22', supID: 2, purchasePrice: 2.32, sellPrice: 4.32 },
  { brandName: 'Neurontin', genericName: 'gabapentin', NDC: '23456', dosage: '80', expDate: 'Dec-22', supID: 2, purchasePrice: 35.67, sellPrice: 37.66 },
  { brandName: 'Zocor', genericName: 'simvastatin', NDC: '23467', dosage: '80', expDate: 'May-23', supID: 1, purchasePrice: 12.44, sellPrice: 14.54 },
  { brandName: 'Lipitor', genericName: 'atorvastatin', NDC: '23567', dosage: '10', expDate: 'Sep-22', supID: 1, purchasePrice: 11.23, sellPrice: 12.55 },
  { brandName: 'Lasix', genericName: 'furosemide', NDC: '34321', dosage: '20', expDate: 'Apr-24', supID: 1, purchasePrice: 3.22, sellPrice: 4.33 },
  { brandName: 'Imdur', genericName: 'isosorbide', NDC: '34532', dosage: '30', expDate: 'Apr-23', supID: 2, purchasePrice: 12.77, sellPrice: 14.55 },
  { brandName: 'Mobic', genericName: 'meloxicam', NDC: '34543', dosage: '15', expDate: 'Sep-23', supID: 1, purchasePrice: 4.65, sellPrice: 6.76 },
  { brandName: 'Naprosyn', genericName: 'naproxen', NDC: '34567', dosage: '50', expDate: 'Aug-24', supID: 1, purchasePrice: 2.55, sellPrice: 5.67 },
  { brandName: 'Neurontin', genericName: 'gabapentin', NDC: '43234', dosage: '40', expDate: 'Dec-22', supID: 2, purchasePrice: 33.43, sellPrice: 40.33 },
  { brandName: 'Motrin', genericName: 'ibuprophen', NDC: '45652', dosage: '60', expDate: 'Apr-21', supID: 2, purchasePrice: 2.34, sellPrice: 4.33 },
  { brandName: 'Ambien', genericName: 'zolpidem', NDC: '45687', dosage: '25', expDate: 'Nov-25', supID: 2, purchasePrice: 77.87, sellPrice: 90.76 },
  { brandName: 'Tenormin', genericName: 'atenolol', NDC: '45689', dosage: '20', expDate: 'Nov-23', supID: 2, purchasePrice: 13.88, sellPrice: 14.9 },
  { brandName: 'Aldactone', genericName: 'sprinolactone', NDC: '45698', dosage: '60', expDate: 'Dec-24', supID: 1, purchasePrice: 13.54, sellPrice: 14.67 },
  { brandName: 'Lipitor', genericName: 'atorvastatin', NDC: '56765', dosage: '40', expDate: 'Oct-26', supID: 1, purchasePrice: 12.23, sellPrice: 13.45 },
  { brandName: 'Plavix', genericName: 'clopidogrel', NDC: '65456', dosage: '75', expDate: 'Mar-21', supID: 1, purchasePrice: 9.33, sellPrice: 10.43 },
  { brandName: 'Prilosec', genericName: 'omeprazole', NDC: '67542', dosage: '20', expDate: 'Mar-22', supID: 1, purchasePrice: 6.77, sellPrice: 10.45 },
  { brandName: 'Tenormin', genericName: 'atenolol', NDC: '67545', dosage: '10', expDate: 'Nov-22', supID: 2, purchasePrice: 13.92, sellPrice: 16.93 },
  { brandName: 'Tenormin', genericName: 'atenolol', NDC: '67854', dosage: '30', expDate: 'Apr-25', supID: 2, purchasePrice: 13.77, sellPrice: 15.98 },
  { brandName: 'Cozaar', genericName: 'losartan', NDC: '67876', dosage: '50', expDate: 'Sep-23', supID: 1, purchasePrice: 6.77, sellPrice: 7.89 },
  { brandName: 'Cozaar', genericName: 'losartan', NDC: '78965', dosage: '100', expDate: 'May-23', supID: 1, purchasePrice: 5.45, sellPrice: 6.78 },
  { brandName: 'Tylenol', genericName: 'acetaminophen', NDC: '78977', dosage: '100', expDate: 'Dec-23', supID: 1, purchasePrice: 1.98, sellPrice: 3.44 },
  { brandName: 'Ambien', genericName: 'zolpidem', NDC: '78987', dosage: '80', expDate: 'Nov-24', supID: 2, purchasePrice: 25.44, sellPrice: 30.56 },
];

// Suppliers Table
export const SUPPLIERS = [
  { supID: 1, name: 'Cardinal Health', address: '7000 Cardinal Place, Dublin, OH 43017', phone: '(614)553-4460' },
  { supID: 2, name: 'McKesson', address: '6555 Sate Hwy, Irving, TX 75039', phone: '(734)427-2000' },
];

// Prescriptions Table
export const PRESCRIPTIONS = [
  { patientID: 2, physID: 2, NDC: '78965', qty: 30, days: 30, refills: 5, status: 'picked up' },
  { patientID: 2, physID: 2, NDC: '23567', qty: 30, days: 30, refills: 0, status: 'picked up' },
  { patientID: 2, physID: 2, NDC: '43234', qty: 60, days: 30, refills: 5, status: 'picked up' },
  { patientID: 7, physID: 1, NDC: '23467', qty: 30, days: 30, refills: 2, status: 'filled' },
  { patientID: 5, physID: 7, NDC: '12365', qty: 15, days: 15, refills: 0, status: '' },
  { patientID: 5, physID: 7, NDC: '34321', qty: 15, days: 15, refills: 0, status: '' },
  { patientID: 1, physID: 9, NDC: '23567', qty: 30, days: 15, refills: 0, status: 'filled' },
  { patientID: 1, physID: 9, NDC: '67876', qty: 30, days: 15, refills: 0, status: 'filled' },
  { patientID: 14, physID: 5, NDC: '17863', qty: 60, days: 60, refills: 3, status: '' },
  { patientID: 14, physID: 5, NDC: '45652', qty: 60, days: 60, refills: 3, status: '' },
  { patientID: 4, physID: 3, NDC: '34543', qty: 30, days: 30, refills: 5, status: 'filled' },
  { patientID: 7, physID: 1, NDC: '23456', qty: 30, days: 30, refills: 0, status: 'filled' },
  { patientID: 7, physID: 1, NDC: '67876', qty: 30, days: 30, refills: 5, status: 'filled' },
  { patientID: 7, physID: 1, NDC: '45698', qty: 60, days: 30, refills: 5, status: 'filled' },
  { patientID: 7, physID: 1, NDC: '78987', qty: 30, days: 30, refills: 5, status: 'filled' },
];

// Insurance Table
export const INSURANCE = [
  { name: 'Molina', phone: '(800)890-0909', coPay: 'No' },
  { name: 'BlueCross', phone: '(800)567-9008', coPay: 'Yes' },
  { name: 'UnitedHealth', phone: '(800)987-4565', coPay: 'No' },
  { name: 'BlueShield', phone: '(800)124-0503', coPay: 'Yes' },
  { name: 'Alliance', phone: '(800)657-9032', coPay: 'No' },
  { name: 'Meridian', phone: '(800)657-4445', coPay: 'No' },
  { name: 'PriorityHealth', phone: '(800)678-3212', coPay: 'No' },
];
