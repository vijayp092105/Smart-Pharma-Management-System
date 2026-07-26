import re
import json
from typing import Dict, List, Optional, Tuple
import sqlparse
from sqlalchemy import text
from src.utils.database import get_table_metadata

class SQLGenerator:
    def __init__(self):
        self.table_metadata = get_table_metadata()
        self.intent_keywords = {
            'stock': ['stock', 'inventory', 'quantity', 'available', 'supply', 'units', 'how many'],
            'expiry': ['expire', 'expiry', 'expiration', 'date', 'soon', 'old', 'going bad'],
            'sales': ['sales', 'revenue', 'profit', 'income', 'sold', 'earning', 'money'],
            'patient': ['patient', 'customer', 'client', 'person', 'demographic'],
            'prescription': ['prescription', 'medication', 'drug', 'medicine', 'pill', 'tablet'],
            'doctor': ['doctor', 'physician', 'prescriber', 'dr.', 'md'],
            'supplier': ['supplier', 'vendor', 'manufacturer', 'company'],
            'alert': ['alert', 'warning', 'issue', 'problem', 'urgent', 'critical']
        }
        
        # SQL templates for different intents
        self.sql_templates = {
            'stock_query': {
                'pattern': r'(how many|what is the stock|quantity of|available)(.+)',
                'sql': "SELECT brand_name, generic_name, current_quantity, min_quantity FROM drugs WHERE {condition}",
                'default': "SELECT brand_name, generic_name, current_quantity, min_quantity FROM drugs WHERE current_quantity < min_quantity ORDER BY current_quantity ASC LIMIT 10"
            },
            'expiry_query': {
                'pattern': r'(expiring|expiry|expire|going bad)(.+)',
                'sql': "SELECT brand_name, generic_name, expiry_date, current_quantity FROM drugs WHERE {condition}",
                'default': "SELECT brand_name, generic_name, expiry_date, current_quantity FROM drugs WHERE expiry_date <= CURRENT_DATE + INTERVAL '30 days' ORDER BY expiry_date ASC LIMIT 10"
            },
            'sales_query': {
                'pattern': r'(sales|revenue|profit|earning|money)(.+)',
                'sql': "SELECT d.brand_name, SUM(st.quantity_sold) as total_sold, SUM(st.sale_amount) as total_revenue FROM sales_transactions st JOIN drugs d ON st.drug_id = d.id WHERE {condition} GROUP BY d.brand_name ORDER BY total_revenue DESC",
                'default': "SELECT d.brand_name, SUM(st.quantity_sold) as total_sold, SUM(st.sale_amount) as total_revenue FROM sales_transactions st JOIN drugs d ON st.drug_id = d.id WHERE st.transaction_date >= CURRENT_DATE - INTERVAL '30 days' GROUP BY d.brand_name ORDER BY total_revenue DESC LIMIT 10"
            }
        }
    
    def extract_drug_name(self, query: str) -> Optional[str]:
        """Extract drug name from natural language query."""
        drug_keywords = [
            'lipitor', 'amoxil', 'motrin', 'neurontin', 'zocor', 'lasix',
            'mobic', 'naprosyn', 'ambien', 'tenormin', 'cozaar', 'tylenol',
            'aldactone', 'glucotrol', 'imdur', 'prilosec', 'plavix'
        ]
        
        query_lower = query.lower()
        for drug in drug_keywords:
            if drug in query_lower:
                return drug
        
        # Try to extract drug name using patterns
        patterns = [
            r'for (\w+)',
            r'of (\w+)',
            r'(\w+) stock',
            r'(\w+) quantity'
        ]
        
        for pattern in patterns:
            match = re.search(pattern, query_lower)
            if match:
                potential_drug = match.group(1)
                if len(potential_drug) > 3:  # Avoid short words
                    return potential_drug
        
        return None
    
    def detect_intent(self, query: str) -> Dict:
        """Detect the intent of the query."""
        query_lower = query.lower()
        scores = {intent: 0 for intent in self.intent_keywords}
        
        # Score each intent based on keyword matches
        for intent, keywords in self.intent_keywords.items():
            for keyword in keywords:
                if keyword in query_lower:
                    scores[intent] += 1
        
        # Get top intent
        top_intent = max(scores, key=scores.get)
        confidence = scores[top_intent] / len(query_lower.split()) if query_lower.split() else 0
        
        # Map to SQL intent
        intent_map = {
            'stock': 'stock_query',
            'expiry': 'expiry_query',
            'sales': 'sales_query',
            'patient': 'patient_query',
            'prescription': 'prescription_query'
        }
        
        sql_intent = intent_map.get(top_intent, 'general_query')
        
        return {
            'intent': sql_intent,
            'confidence': min(confidence, 1.0),
            'details': {
                'drug_name': self.extract_drug_name(query),
                'time_period': self.extract_time_period(query),
                'comparison': self.extract_comparison(query)
            }
        }
    
    def extract_time_period(self, query: str) -> Optional[str]:
        """Extract time period from query."""
        time_patterns = {
            'today': r'today',
            'yesterday': r'yesterday',
            'week': r'week|last week|this week|weekly',
            'month': r'month|last month|this month|monthly',
            'year': r'year|last year|this year|yearly',
            'days': r'(\d+)\s*days',
            'months': r'(\d+)\s*months'
        }
        
        query_lower = query.lower()
        for period, pattern in time_patterns.items():
            match = re.search(pattern, query_lower)
            if match:
                if period in ['days', 'months']:
                    return f"{match.group(1)} {period}"
                return period
        
        return None
    
    def extract_comparison(self, query: str) -> Optional[str]:
        """Extract comparison operators from query."""
        comparisons = {
            'less than': r'less than|below|under|<',
            'greater than': r'greater than|more than|above|over|>',
            'equal to': r'equal to|exactly|='
        }
        
        query_lower = query.lower()
        for comparison, pattern in comparisons.items():
            if re.search(pattern, query_lower):
                return comparison
        
        return None
    
    def generate_sql(self, query: str) -> Tuple[str, Dict]:
        """Generate SQL from natural language query."""
        intent_info = self.detect_intent(query)
        intent = intent_info['intent']
        details = intent_info['details']
        
        if intent not in self.sql_templates:
            # Fallback to general information query
            return self.generate_general_sql(query), intent_info
        
        template = self.sql_templates[intent]
        
        # Build WHERE condition
        conditions = []
        
        # Add drug name condition
        if details['drug_name']:
            conditions.append(f"LOWER(brand_name) LIKE '%{details['drug_name']}%' OR LOWER(generic_name) LIKE '%{details['drug_name']}%'")
        
        # Add time period condition for sales
        if intent == 'sales_query' and details['time_period']:
            if details['time_period'] == 'week':
                conditions.append("st.transaction_date >= CURRENT_DATE - INTERVAL '7 days'")
            elif details['time_period'] == 'month':
                conditions.append("st.transaction_date >= CURRENT_DATE - INTERVAL '30 days'")
            elif 'days' in details['time_period']:
                days = details['time_period'].split()[0]
                conditions.append(f"st.transaction_date >= CURRENT_DATE - INTERVAL '{days} days'")
        
        # Add comparison for stock
        if intent == 'stock_query' and details['comparison']:
            if details['comparison'] == 'less than':
                conditions.append("current_quantity < 20")
            elif details['comparison'] == 'greater than':
                conditions.append("current_quantity > 100")
        
        # Build final SQL
        if conditions:
            where_clause = " AND ".join(conditions)
            sql = template['sql'].format(condition=where_clause)
        else:
            sql = template['default']
        
        # Format SQL
        sql = sqlparse.format(sql, reindent=True, keyword_case='upper')
        
        return sql, intent_info
    
    def generate_general_sql(self, query: str) -> str:
        """Generate SQL for general information queries."""
        query_lower = query.lower()
        
        if any(word in query_lower for word in ['how many', 'count', 'total']):
            if 'patient' in query_lower:
                return "SELECT COUNT(*) as total_patients FROM patients"
            elif 'doctor' in query_lower:
                return "SELECT COUNT(*) as total_doctors FROM doctors"
            elif 'drug' in query_lower:
                return "SELECT COUNT(*) as total_drugs FROM drugs"
            elif 'prescription' in query_lower:
                return "SELECT COUNT(*) as total_prescriptions FROM prescriptions"
        
        # Default: get summary
        return """
            SELECT 
                (SELECT COUNT(*) FROM patients) as total_patients,
                (SELECT COUNT(*) FROM doctors) as total_doctors,
                (SELECT COUNT(*) FROM drugs) as total_drugs,
                (SELECT COUNT(*) FROM prescriptions WHERE status = 'pending') as pending_prescriptions,
                (SELECT COUNT(*) FROM drugs WHERE current_quantity < min_quantity) as low_stock_drugs
        """
    
    def validate_sql(self, sql: str) -> bool:
        """Validate SQL query for safety."""
        # List of dangerous SQL keywords
        dangerous_keywords = ['DROP', 'DELETE', 'UPDATE', 'INSERT', 'ALTER', 'TRUNCATE', 'EXEC', 'EXECUTE']
        
        # Check for dangerous operations
        sql_upper = sql.upper()
        for keyword in dangerous_keywords:
            if keyword in sql_upper and 'WHERE' not in sql_upper:
                return False
        
        # Check if it's a SELECT query (read-only)
        if not sql_upper.strip().startswith('SELECT'):
            return False
        
        return True

# Singleton instance
sql_generator = SQLGenerator()