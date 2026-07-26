const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ChatHistory = sequelize.define('ChatHistory', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  sessionId: {
    type: DataTypes.UUID,
    field: 'session_id',
    defaultValue: DataTypes.UUIDV4
  },
  userMessage: {
    type: DataTypes.TEXT,
    field: 'user_message',
    allowNull: false
  },
  assistantMessage: {
    type: DataTypes.TEXT,
    field: 'assistant_message',
    allowNull: false
  },
  intent: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  confidenceScore: {
    type: DataTypes.DECIMAL(3, 2),
    field: 'confidence_score',
    allowNull: true
  }
}, {
  tableName: 'chat_history',
  timestamps: true,
  underscored: true
});

module.exports = ChatHistory;