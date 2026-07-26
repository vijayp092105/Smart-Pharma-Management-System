const axios = require('axios');

class AIService {
  constructor() {
    this.baseURL = process.env.AI_SERVICE_URL || 'http://localhost:8000';
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 30000, // 30 seconds timeout for AI responses
    });
  }

  async healthCheck() {
    try {
      const response = await this.client.get('/health');
      return {
        healthy: response.data.status === 'healthy',
        ...response.data
      };
    } catch (error) {
      console.error('AI Service health check failed:', error.message);
      return {
        healthy: false,
        error: error.message
      };
    }
  }

  async chat(message, sessionId = 'default') {
    try {
      const response = await this.client.post('/chat', {
        message,
        session_id: sessionId
      });
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('AI Service chat error:', error.message);
      
      // Fallback to simple responses if AI service is down
      return {
        success: false,
        data: this.getFallbackResponse(message)
      };
    }
  }

  async executePharmacyQuery(queryName) {
    try {
      const response = await this.client.get(`/pharmacy/${queryName}`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error(`AI Service query error for ${queryName}:`, error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  getFallbackResponse(message) {
    const lowerMsg = message.toLowerCase();
    
    // Simple fallback responses
    if (lowerMsg.includes('stock') || lowerMsg.includes('inventory')) {
      return {
        response: "I can help you check stock levels! Our system tracks all medications in real-time. You can check specific drugs or get a full inventory report.",
        intent: 'stock_query',
        confidence: 0.7,
        data_available: false,
        context_used: false,
        session_id: 'fallback'
      };
    } else if (lowerMsg.includes('expiry') || lowerMsg.includes('expire')) {
      return {
        response: "I can check expiry dates for you! We monitor all medications and alert you 30 days before expiration. Would you like me to check specific drugs?",
        intent: 'expiry_query',
        confidence: 0.7,
        data_available: false,
        context_used: false,
        session_id: 'fallback'
      };
    } else if (lowerMsg.includes('sales') || lowerMsg.includes('revenue')) {
      return {
        response: "I can provide sales analytics! Our system tracks all transactions and provides insights on top-selling drugs, revenue trends, and more.",
        intent: 'sales_query',
        confidence: 0.7,
        data_available: false,
        context_used: false,
        session_id: 'fallback'
      };
    } else if (lowerMsg.includes('hello') || lowerMsg.includes('hi')) {
      return {
        response: "Hello! I'm your pharmacy assistant. I can help you with inventory, expiry dates, sales reports, and more. How can I assist you today?",
        intent: 'greeting',
        confidence: 0.9,
        data_available: false,
        context_used: false,
        session_id: 'fallback'
      };
    } else {
      return {
        response: "I'm here to help with pharmacy management! I can assist with:\n• Inventory queries\n• Expiry date checks\n• Sales analytics\n• Prescription tracking\n\nWhat would you like to know?",
        intent: 'general',
        confidence: 0.5,
        data_available: false,
        context_used: false,
        session_id: 'fallback'
      };
    }
  }
}

module.exports = new AIService();