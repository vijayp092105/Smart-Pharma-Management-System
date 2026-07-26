import psycopg2
from psycopg2 import pool
from psycopg2.extras import RealDictCursor
import os
from dotenv import load_dotenv
import logging

load_dotenv()
logger = logging.getLogger(__name__)

class Database:
    _connection_pool = None
    
    @classmethod
    def initialize(cls):
        """Initialize database connection pool."""
        try:
            cls._connection_pool = psycopg2.pool.SimpleConnectionPool(
                1, 10,  # min, max connections
                host=os.getenv('DB_HOST', 'localhost'),
                port=os.getenv('DB_PORT', '5432'),
                database=os.getenv('DB_NAME', 'pharmacy_db'),
                user=os.getenv('DB_USER', 'postgres'),
                password=os.getenv('DB_PASSWORD', '')
            )
            logger.info("Database connection pool initialized")
        except Exception as e:
            logger.error(f"Failed to initialize database pool: {e}")
            raise
    
    @classmethod
    def get_connection(cls):
        """Get a database connection from the pool."""
        if cls._connection_pool is None:
            cls.initialize()
        
        try:
            return cls._connection_pool.getconn()
        except Exception as e:
            logger.error(f"Failed to get database connection: {e}")
            raise
    
    @classmethod
    def return_connection(cls, connection):
        """Return connection to the pool."""
        if cls._connection_pool and connection:
            cls._connection_pool.putconn(connection)
    
    @classmethod
    def execute_query(cls, query, params=None, fetch=True):
        """Execute a SQL query and return results."""
        connection = None
        cursor = None
        
        try:
            connection = cls.get_connection()
            cursor = connection.cursor(cursor_factory=RealDictCursor)
            
            if params:
                cursor.execute(query, params)
            else:
                cursor.execute(query)
            
            if fetch and cursor.description:  # If query returns results
                result = cursor.fetchall()
                return result
            else:
                connection.commit()
                return cursor.rowcount
            
        except Exception as e:
            if connection:
                connection.rollback()
            logger.error(f"Query execution error: {e}")
            raise
        finally:
            if cursor:
                cursor.close()
            if connection:
                cls.return_connection(connection)
    
    @classmethod
    def close_all(cls):
        """Close all database connections."""
        if cls._connection_pool:
            cls._connection_pool.closeall()
            logger.info("All database connections closed")

# Pharmacy-specific queries
class PharmacyQueries:
    @staticmethod
    def get_low_stock_drugs(threshold=20):
        """Get drugs with stock below threshold."""
        query = """
            SELECT d.id, d.brand_name, d.generic_name, d.ndc, 
                   d.current_quantity, d.min_quantity, d.expiry_date,
                   s.name as supplier_name, s.phone as supplier_phone
            FROM drugs d
            LEFT JOIN suppliers s ON d.supplier_id = s.id
            WHERE d.current_quantity < %s
            ORDER BY d.current_quantity ASC
        """
        return Database.execute_query(query, (threshold,))
    
    @staticmethod
    def get_expiring_drugs(days_threshold=30):
        """Get drugs expiring within specified days."""
        query = """
            SELECT id, brand_name, generic_name, ndc, 
                   expiry_date, current_quantity,
                   EXTRACT(DAY FROM (expiry_date - CURRENT_DATE)) as days_until_expiry
            FROM drugs
            WHERE expiry_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '%s days'
            ORDER BY expiry_date ASC
        """
        return Database.execute_query(query, (days_threshold,))
    
    @staticmethod
    def get_alert_history(limit=10):
        """Get recent alert history."""
        query = """
            SELECT ah.id, ah.alert_type, ah.message, ah.severity,
                   ah.sent_to_telegram, ah.resolved, ah.created_at,
                   d.brand_name, d.generic_name
            FROM alert_history ah
            LEFT JOIN drugs d ON ah.drug_id = d.id
            ORDER BY ah.created_at DESC
            LIMIT %s
        """
        return Database.execute_query(query, (limit,))
    
    @staticmethod
    def create_alert(alert_type, drug_id, message, severity='warning'):
        """Create a new alert in the database."""
        query = """
            INSERT INTO alert_history 
            (alert_type, drug_id, message, severity, sent_to_telegram, resolved)
            VALUES (%s, %s, %s, %s, false, false)
            RETURNING id
        """
        return Database.execute_query(query, (alert_type, drug_id, message, severity), fetch=False)
    
    @staticmethod
    def mark_alert_sent(alert_id):
        """Mark alert as sent to Telegram."""
        query = """
            UPDATE alert_history 
            SET sent_to_telegram = true, updated_at = CURRENT_TIMESTAMP
            WHERE id = %s
        """
        return Database.execute_query(query, (alert_id,), fetch=False)
    
    @staticmethod
    def mark_alert_resolved(alert_id):
        """Mark alert as resolved."""
        query = """
            UPDATE alert_history 
            SET resolved = true, updated_at = CURRENT_TIMESTAMP
            WHERE id = %s
        """
        return Database.execute_query(query, (alert_id,), fetch=False)
    
    @staticmethod
    def get_supplier_info(supplier_id):
        """Get supplier contact information."""
        query = """
            SELECT name, phone, address
            FROM suppliers
            WHERE id = %s
        """
        result = Database.execute_query(query, (supplier_id,))
        return result[0] if result else None