-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Patients Table (matches your PATIENTS array)
CREATE TABLE patients (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER UNIQUE NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    birthdate DATE,
    address TEXT,
    phone VARCHAR(20),
    gender VARCHAR(10),
    insurance VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Doctors Table (matches your DOCTORS array)
CREATE TABLE doctors (
    id SERIAL PRIMARY KEY,
    phys_id INTEGER UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    address TEXT,
    phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Suppliers Table (matches your SUPPLIERS array)
CREATE TABLE suppliers (
    id SERIAL PRIMARY KEY,
    sup_id INTEGER UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    address TEXT,
    phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insurance Table (matches your INSURANCE array)
CREATE TABLE insurance (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(20),
    co_pay BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Drugs Table (matches your DRUGS array) with quantity tracking
CREATE TABLE drugs (
    id SERIAL PRIMARY KEY,
    ndc VARCHAR(20) UNIQUE NOT NULL,
    brand_name VARCHAR(100) NOT NULL,
    generic_name VARCHAR(100) NOT NULL,
    dosage VARCHAR(20),
    expiry_date DATE NOT NULL,
    supplier_id INTEGER REFERENCES suppliers(id),
    purchase_price DECIMAL(10, 2) NOT NULL,
    selling_price DECIMAL(10, 2) NOT NULL,
    current_quantity INTEGER DEFAULT 100, -- Starting quantity
    min_quantity INTEGER DEFAULT 20, -- Alert threshold
    max_quantity INTEGER DEFAULT 500,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Prescriptions Table (matches your PRESCRIPTIONS array)
CREATE TABLE prescriptions (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER REFERENCES patients(id),
    doctor_id INTEGER REFERENCES doctors(id),
    drug_id INTEGER REFERENCES drugs(id),
    quantity INTEGER NOT NULL,
    days_supply INTEGER NOT NULL,
    refills INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'pending',
    filled_date DATE,
    picked_up_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- NEW: Alert History Table for Telegram alerts
CREATE TABLE alert_history (
    id SERIAL PRIMARY KEY,
    alert_type VARCHAR(50) NOT NULL, -- 'low_stock', 'expiry_warning', 'reorder_suggestion'
    drug_id INTEGER REFERENCES drugs(id),
    message TEXT NOT NULL,
    severity VARCHAR(20) DEFAULT 'warning', -- 'info', 'warning', 'critical'
    sent_to_telegram BOOLEAN DEFAULT FALSE,
    resolved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- NEW: Chat History Table for AI Chatbot
CREATE TABLE chat_history (
    id SERIAL PRIMARY KEY,
    session_id UUID DEFAULT uuid_generate_v4(),
    user_message TEXT NOT NULL,
    assistant_message TEXT NOT NULL,
    intent VARCHAR(50), -- 'stock_query', 'expiry_check', 'sales_trend', etc.
    confidence_score DECIMAL(3, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- NEW: Sales Transactions for Forecasting
CREATE TABLE sales_transactions (
    id SERIAL PRIMARY KEY,
    drug_id INTEGER REFERENCES drugs(id),
    prescription_id INTEGER REFERENCES prescriptions(id),
    quantity_sold INTEGER NOT NULL,
    sale_amount DECIMAL(10, 2) NOT NULL,
    transaction_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_drugs_expiry ON drugs(expiry_date);
CREATE INDEX idx_drugs_quantity ON drugs(current_quantity);
CREATE INDEX idx_prescriptions_status ON prescriptions(status);
CREATE INDEX idx_alert_history_type ON alert_history(alert_type);
CREATE INDEX idx_chat_history_session ON chat_history(session_id);
CREATE INDEX idx_sales_date ON sales_transactions(transaction_date);