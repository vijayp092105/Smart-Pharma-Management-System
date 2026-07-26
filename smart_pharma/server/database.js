const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'smartpharma.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database', err);
  } else {
    console.log('Connected to SQLite database');
  }
});

const initDatabase = () => {
  db.serialize(() => {
    // 1. Doctor Data
    db.run(`CREATE TABLE IF NOT EXISTS doctors (
      physID INTEGER,
      name TEXT,
      address TEXT,
      phone TEXT
    )`);

    // 2. Drugs
    db.run(`CREATE TABLE IF NOT EXISTS drugs (
      brandName TEXT,
      genericName TEXT,
      NDC INTEGER,
      dosage INTEGER,
      expDate DATE,
      supID INTEGER,
      purchasePrice REAL,
      sellPrice REAL
    )`);

    // 3. Insurance
    db.run(`CREATE TABLE IF NOT EXISTS insurance (
      name TEXT,
      phone TEXT,
      coPay TEXT
    )`);

    // 4. Patient
    db.run(`CREATE TABLE IF NOT EXISTS patients (
      firstName TEXT,
      lastName TEXT,
      birthdate TEXT,
      address TEXT,
      phone TEXT,
      gender TEXT,
      insurance TEXT,
      patientID INTEGER
    )`);

    // 5. Prescriptions
    db.run(`CREATE TABLE IF NOT EXISTS prescriptions (
      patientID INTEGER,
      physID INTEGER,
      NDC INTEGER,
      qty INTEGER,
      days INTEGER,
      refills INTEGER,
      status TEXT
    )`);

    // 6. Supplier
    db.run(`CREATE TABLE IF NOT EXISTS suppliers (
      name TEXT,
      address TEXT,
      phone TEXT,
      supID INTEGER
    )`);

    // === AUTO SEED DATA (If Empty) ===
    const seed = () => {
      // DRS
      db.get("SELECT count(*) as c FROM doctors", (e, r) => {
        if (r.c === 0) {
          console.log("Seeding Doctors...");
          const drs = [
            [1, 'Robert Hong', '30055 Northwestern Hwy #101', '(248)865-4444'],
            [2, 'Sarsam Muther', '6840 Greenfield Rd', '(313)846-1700'],
            [3, 'Thikra Hussein', '6840 Greenfield Rd', '(789)234-0768'],
            [4, 'Raad Alsaraf', '6840 Greenfield Rd', '(313)846-1700'],
            [5, 'Sundus Jabro', '6840 Greenfield Rd', '(313)678-5434'],
            [6, 'Jonathon State', '19401 Hubbard Dr', '(313)982-4400'],
            [7, 'Gupta Madhu', '2021 Monroe St', '(313)565-8700'],
            [8, 'Zakaria Fayda', '1711 Monroe St', '(313)562-9100'],
            [9, 'Shirley Tom', '17000 Hubbard Dr', '(313)982-4351']
          ];
          drs.forEach(d => db.run("INSERT INTO doctors (physID, name, address, phone) VALUES (?,?,?,?)", d));
        }
      });

      // DRUGS
      db.get("SELECT count(*) as c FROM drugs", (e, r) => {
        if (r.c === 0) {
          console.log("Seeding Drugs...");
          // Manual date conversion for SQLite sorting
          const meds = [
            ['Aldactone', 'sprinolactone', 12365, 25, '2024-12-01', 1, 14.56, 17.88], // Dec-24
            ['Amoxil', 'amoxicillin', 17863, 50, '2025-12-01', 1, 12.34, 15.99], // Dec-25
            ['Glucotrol', 'glipizide', 23123, 50, '2023-11-01', 1, 9.45, 10.55], // Nov-23
            ['Motrin', 'ibuprophen', 23127, 80, '2022-09-01', 2, 2.32, 4.32],   // Sep-22
            ['Neurontin', 'gabapentin', 23456, 80, '2022-12-01', 2, 35.67, 37.66], // Dec-22
            ['Zocor', 'simvastatin', 23467, 80, '2023-05-01', 1, 12.44, 14.54], // May-23
            ['Lipitor', 'atorvastatin', 23567, 10, '2022-09-01', 1, 11.23, 12.55], // Sep-22
            ['Lasix', 'furosemide', 34321, 20, '2024-04-01', 1, 3.22, 4.33],   // Apr-24
            ['Imdur', 'isosorbide', 34532, 30, '2023-04-01', 2, 12.77, 14.55], // Apr-23
            ['Mobic', 'meloxicam', 34543, 15, '2023-09-01', 1, 4.65, 6.76],    // Sep-23
            ['Naprosyn', 'naproxen', 34567, 50, '2024-08-01', 1, 2.55, 5.67],  // Aug-24
            ['Neurontin', 'gabapentin', 43234, 40, '2022-12-01', 2, 33.43, 40.33], // Dec-22
            ['Motrin', 'ibuprophen', 45652, 60, '2021-04-01', 2, 2.34, 4.33],  // Apr-21
            ['Ambien', 'zolpidem', 45687, 25, '2025-11-01', 2, 77.87, 90.76],  // Nov-25
            ['Tenormin', 'atenolol', 45689, 20, '2023-11-01', 2, 13.88, 14.9], // Nov-23
            ['Aldactone', 'sprinolactone', 45698, 60, '2024-12-01', 1, 13.54, 14.67], // Dec-24
            ['Lipitor', 'atorvastatin', 56765, 40, '2026-10-01', 1, 12.23, 13.45], // Oct-26
            ['Plavix', 'clopidogrel', 65456, 75, '2021-03-01', 1, 9.33, 10.43], // Mar-21
            ['Prilosec', 'omeprazole', 67542, 20, '2022-03-01', 1, 6.77, 10.45], // Mar-22
            ['Tenormin', 'atenolol', 67545, 10, '2022-11-01', 2, 13.92, 16.93], // Nov-22
            ['Tenormin', 'atenolol', 67854, 30, '2025-04-01', 2, 13.77, 15.98], // Apr-25
            ['Cozaar', 'losartan', 67876, 50, '2023-09-01', 1, 6.77, 7.89],    // Sep-23
            ['Cozaar', 'losartan', 78965, 100, '2023-05-01', 1, 5.45, 6.78],   // May-23
            ['Tylenol', 'acetaminophen', 78977, 100, '2023-12-01', 1, 1.98, 3.44], // Dec-23
            ['Ambien', 'zolpidem', 78987, 80, '2024-11-01', 2, 25.44, 30.56]   // Nov-24
          ];
          meds.forEach(m => db.run("INSERT INTO drugs (brandName, genericName, NDC, dosage, expDate, supID, purchasePrice, sellPrice) VALUES (?,?,?,?,?,?,?,?)", m));
        }
      });

      // PATIENTS
      db.get("SELECT count(*) as c FROM patients", (e, r) => {
        if (r.c === 0) {
          console.log("Seeding Patients...");
          const pts = [
            ['James', 'Smith', '01-01-1987', '652 Jill Dr.', '(868)456-9876', 'M', 'Molina', 1],
            ['Huda', 'Saleh', '09/22/1999', '347 Moss Rd.', '(313)459-9226', 'F', 'Alliance', 2],
            ['Rachel', 'Wilson', '10/22/1990', '210 Fork St.', '(313)654-0989', 'F', null, 3],
            ['Ali', 'Hamade', '12/31/2001', '410 John R. St.', '(564)879-7623', 'M', 'BlueCross', 4],
            ['Mona', 'Berry', '04/23/2009', '354 Colson Ave.', '(313)768-6543', 'F', 'PriorityHealth', 5],
            ['Jordan', 'Parker', '05-09-1994', '457 Lilly Ln.', '(678)876-4512', 'M', 'BlueCross', 6],
            ['Milly', 'Roger', '11-12-1950', '567 Holli St.', '(678)987-1234', 'F', 'Molina', 7],
            ['Mohammad', 'Musa', '10-10-2010', '100 Cherry Ln.', '(878)546-0980', 'M', null, 9],
            ['Linda', 'Malek', '08-07-1997', '345 Rubard Dr.', '(878)456-0989', 'F', 'Meridian', 10],
            ['Mark', 'Garcia', '09-06-1954', '675 Helen Rd.', '(613)765-0989', 'M', 'BlueShield', 11],
            ['Fatema', 'Almo', '08-06-2004', '768 Castle Cir.', '(313)712-0908', 'F', 'Molina', 13],
            ['Avery', 'Brandon', '02/14/1955', '569 Forrest Ln.', '(134)786-6654', 'F', 'PriorityHealth', 14],
            ['Jose', 'Martinez', '01/19/1988', '555 Morris Rd.', '(976)821-0090', 'M', null, 15],
            ['Rose', 'Johns', '09-05-2000', '897 Mallory Dr.', '(456)897-0908', 'F', 'Molina', 16]
          ];
          pts.forEach(p => db.run("INSERT INTO patients (firstName, lastName, birthdate, address, phone, gender, insurance, patientID) VALUES (?,?,?,?,?,?,?,?)", p));
        }
      });

      // INS
      db.get("SELECT count(*) as c FROM insurance", (e, r) => {
        if (r.c === 0) {
          const ins = [
            ['Molina', '(800)890-0909', 'No'],
            ['BlueCross', '(800)567-9008', 'Yes'],
            ['UnitedHealth', '(800)987-4565', 'No'],
            ['BlueShield', '(800)124-0503', 'Yes'],
            ['Alliance', '(800)657-9032', 'No'],
            ['Meridian', '(800)657-4445', 'No'],
            ['PriorityHealth', '(800)678-3212', 'No']
          ];
          ins.forEach(i => db.run("INSERT INTO insurance (name, phone, coPay) VALUES (?,?,?)", i));
        }
      });

      // SUP
      db.get("SELECT count(*) as c FROM suppliers", (e, r) => {
        if (r.c === 0) {
          const sups = [
            ['Cardinal Health', '7000 Cardinal Place, Dublin, OH 43017', '(614)553-4460', 1],
            ['McKesson', '6555 Sate Hwy, Irving, TX 75039', '(734)427-2000', 2]
          ];
          sups.forEach(s => db.run("INSERT INTO suppliers (name, address, phone, supID) VALUES (?,?,?,?)", s));
        }
      });

      // RX
      db.get("SELECT count(*) as c FROM prescriptions", (e, r) => {
        if (r.c === 0) {
          const rxs = [
            [2, 2, 78965, 30, 30, 5, 'picked up'],
            [2, 2, 23567, 30, 30, 0, 'picked up'],
            [2, 2, 43234, 60, 30, 5, 'picked up'],
            [7, 1, 23467, 30, 30, 2, 'filled'],
            [5, 7, 12365, 15, 15, 0, 'pending'],
            [5, 7, 34321, 15, 15, 0, 'pending'],
            [1, 9, 23567, 30, 15, 0, 'filled'],
            [1, 9, 67876, 30, 15, 0, 'filled'],
            [14, 5, 17863, 60, 60, 3, 'pending'],
            [14, 5, 45652, 60, 60, 3, 'pending'],
            [4, 3, 34543, 30, 30, 5, 'filled'],
            [7, 1, 23456, 30, 30, 0, 'filled'],
            [7, 1, 67876, 30, 30, 5, 'filled'],
            [7, 1, 45698, 60, 30, 5, 'filled'],
            [7, 1, 78987, 30, 30, 5, 'filled']
          ];
          rxs.forEach(x => db.run("INSERT INTO prescriptions (patientID, physID, NDC, qty, days, refills, status) VALUES (?,?,?,?,?,?,?)", x));
        }
      });
    };

    // Run seed after a short delay
    setTimeout(seed, 1000);
  });
};

module.exports = { db, initDatabase };
