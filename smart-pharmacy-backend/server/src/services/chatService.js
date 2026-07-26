// server/src/services/chatService.js
// Simple chat service with a placeholder analyzeIntent function.
// Replace analyzeIntent implementation with your AI model / external API as needed.

const sanitize = (s) => (typeof s === 'string' ? s.trim() : '');

class ChatService {
  /**
   * Very small rule-based intent analyzer as placeholder.
   * Input: { message: string, userId?: number }
   * Output: { intent: string, entities: object, reply: string, confidence: number }
   */
  async analyzeIntent({ message = '', userId = null } = {}) {
    const text = sanitize(message).toLowerCase();

    // Basic rules
    if (!text) {
      return {
        intent: 'empty',
        entities: {},
        reply: "I didn't receive a message. Please type something.",
        confidence: 0.0
      };
    }

    // greetings
    if (/\b(hi|hello|hey|good morning|good evening)\b/.test(text)) {
      return { intent: 'greeting', entities: {}, reply: 'Hello! How can I help you today?', confidence: 0.9 };
    }

    // inventory queries
    if (/\b(stock|available|quantity|how many|in stock)\b/.test(text)) {
      // try extract drug name
      const match = text.match(/(?:stock|available|quantity|how many|in stock).*(?:of )?([a-z0-9\s\-]+)/i);
      const drug = match ? match[1].trim() : null;
      return {
        intent: 'inventory_query',
        entities: { drug: drug || null },
        reply: drug ? `Checking stock for "${drug}"... (placeholder)` : 'Which drug do you want to check stock for?',
        confidence: 0.75
      };
    }

    // reorder requests
    if (/\b(reorder|order|restock|supply)\b/.test(text)) {
      return { intent: 'reorder', entities: {}, reply: 'I can prepare a reorder suggestion. Which drug?', confidence: 0.7 };
    }

    // fallback: echo / small response
    return {
      intent: 'fallback',
      entities: {},
      reply: "Sorry, I didn't understand exactly. You can ask about stock, reorder suggestions, or say 'hi'.",
      confidence: 0.4
    };
  }

  // If you want to persist chat messages, add methods here to save to DB
  async saveChat({ sessionId = null, userMessage = '', assistantMessage = '' } = {}) {
    // optional: implement persistence using ChatHistory model
    return true;
  }
}

module.exports = new ChatService();
