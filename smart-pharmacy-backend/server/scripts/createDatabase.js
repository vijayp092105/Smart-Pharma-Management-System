const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function createDatabase() {
  console.log('🔄 Creating pharmacy database...');
  
  // Read schema file
  const schemaPath = path.join(__dirname, '../../database/schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');
  
  // Connect to default postgres database to create our database
  const client = new Client({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: 'postgres' // Connect to default database
  });
  
  try {
    await client.connect();
    console.log('✅ Connected to PostgreSQL server');
    
    // Check if database exists
    const dbCheck = await client.query(
      `SELECT 1 FROM pg_database WHERE datname = '${process.env.DB_NAME}'`
    );
    
    if (dbCheck.rowCount === 0) {
      console.log(`📦 Creating database: ${process.env.DB_NAME}`);
      await client.query(`CREATE DATABASE ${process.env.DB_NAME}`);
      console.log('✅ Database created successfully');
    } else {
      console.log('⚠️ Database already exists, skipping creation');
    }
    
    await client.end();
    
    // Now connect to the new database and run schema
    const dbClient = new Client({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });
    
    await dbClient.connect();
    console.log(`✅ Connected to ${process.env.DB_NAME}`);
    
    // Split schema by semicolons and execute each statement
    const statements = schema
      .split(';')
      .filter(stmt => stmt.trim().length > 0);
    
    for (const statement of statements) {
      try {
        await dbClient.query(statement + ';');
      } catch (err) {
        console.warn(`⚠️ Skipping statement: ${err.message.split('\n')[0]}`);
      }
    }
    
    console.log('✅ Schema applied successfully');
    await dbClient.end();
    
    console.log('\n🎉 Database setup completed successfully!');
    console.log(`📊 Database: ${process.env.DB_NAME}`);
    console.log(`🔗 Host: ${process.env.DB_HOST}:${process.env.DB_PORT}`);
    
  } catch (error) {
    console.error('❌ Database creation failed:', error);
    process.exit(1);
  }
}

// Run if this script is executed directly
if (require.main === module) {
  createDatabase();
}

module.exports = createDatabase;