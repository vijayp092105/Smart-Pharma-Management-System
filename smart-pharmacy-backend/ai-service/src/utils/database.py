from sqlalchemy import create_engine, text, MetaData, Table
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base
from contextlib import contextmanager
from config import config
import pandas as pd

# Create database engine
engine = create_engine(config.get_database_url(), pool_pre_ping=True, pool_recycle=300)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()
metadata = MetaData()

@contextmanager
def get_db():
    """Database session context manager."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def execute_query(query, params=None):
    """Execute SQL query and return results as DataFrame."""
    try:
        with engine.connect() as connection:
            if params:
                result = connection.execute(text(query), params)
            else:
                result = connection.execute(text(query))
            
            if result.returns_rows:
                df = pd.DataFrame(result.fetchall(), columns=result.keys())
                return df
            else:
                return None
    except Exception as e:
        print(f"Query execution error: {e}")
        raise

def get_table_metadata():
    """Get metadata about all tables."""
    metadata.reflect(bind=engine)
    table_info = {}
    
    for table_name, table in metadata.tables.items():
        columns = []
        for column in table.columns:
            columns.append({
                'name': column.name,
                'type': str(column.type),
                'nullable': column.nullable,
                'primary_key': column.primary_key
            })
        
        table_info[table_name] = {
            'columns': columns,
            'row_count': get_row_count(table_name)
        }
    
    return table_info

def get_row_count(table_name):
    """Get row count for a table."""
    query = f"SELECT COUNT(*) as count FROM {table_name}"
    result = execute_query(query)
    return result.iloc[0]['count'] if result is not None else 0

# Common pharmacy queries
PHARMACY_QUERIES = {
    'drug_stock': """
        SELECT d.brand_name, d.generic_name, d.ndc, d.current_quantity, d.min_quantity, d.expiry_date,
               s.name as supplier_name
        FROM drugs d
        LEFT JOIN suppliers s ON d.supplier_id = s.id
        WHERE d.current_quantity < d.min_quantity
        ORDER BY d.current_quantity ASC
    """,
    
    'expiring_drugs': """
        SELECT brand_name, generic_name, ndc, expiry_date, current_quantity
        FROM drugs
        WHERE expiry_date <= CURRENT_DATE + INTERVAL '30 days'
        ORDER BY expiry_date ASC
    """,
    
    'top_selling_drugs': """
        SELECT d.brand_name, d.generic_name, 
               SUM(st.quantity_sold) as total_sold,
               SUM(st.sale_amount) as total_revenue
        FROM sales_transactions st
        JOIN drugs d ON st.drug_id = d.id
        WHERE st.transaction_date >= CURRENT_DATE - INTERVAL '30 days'
        GROUP BY d.id, d.brand_name, d.generic_name
        ORDER BY total_revenue DESC
        LIMIT 10
    """,
    
    'patient_prescriptions': """
        SELECT p.first_name, p.last_name, COUNT(pr.id) as prescription_count
        FROM patients p
        LEFT JOIN prescriptions pr ON p.id = pr.patient_id
        GROUP BY p.id, p.first_name, p.last_name
        ORDER BY prescription_count DESC
    """,
    
    'recent_sales': """
        SELECT DATE(st.transaction_date) as sale_date,
               SUM(st.quantity_sold) as daily_quantity,
               SUM(st.sale_amount) as daily_revenue
        FROM sales_transactions st
        WHERE st.transaction_date >= CURRENT_DATE - INTERVAL '7 days'
        GROUP BY DATE(st.transaction_date)
        ORDER BY sale_date DESC
    """
}

def execute_pharmacy_query(query_name, params=None):
    """Execute predefined pharmacy query."""
    if query_name in PHARMACY_QUERIES:
        return execute_query(PHARMACY_QUERIES[query_name], params)
    else:
        raise ValueError(f"Unknown query: {query_name}")