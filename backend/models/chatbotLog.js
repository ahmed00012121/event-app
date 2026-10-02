// backend/models/chatbotLog.js
const mongoose = require("mongoose");

/**
 * Schema for individual messages in a conversation
 */
const messageSchema = new mongoose.Schema({
  sender: { type: String, enum: ["user", "bot"], required: true },
  text: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  metadata: {
    // Optional metadata for tracking action responses, navigations, etc.
    action: String,        // e.g., "register", "navigate", "show_stats"
    actionData: mongoose.Schema.Types.Mixed,  // Any additional data about the action
    duration: Number       // Response time in ms
  }
});

/**
 * Schema for chatbot conversation logs
 * Stores complete conversation history with role-based metadata
 */
const chatbotLogSchema = new mongoose.Schema(
  {
    userId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Student",
      index: true
    },
    role: { 
      type: String, 
      enum: ["student", "admin", "guest"], 
      required: true,
      index: true
    },
    messages: [messageSchema],
    
    // Conversation metadata
    sentiment: String,      // "positive", "negative", "neutral" (can be computed later)
    topic: String,          // "events", "registration", "feedback", etc.
    resolved: { type: Boolean, default: false },  // Was the user's query resolved?
    feedbackRating: Number, // 1-5 star rating if user rates the interaction
    
    // Tracking
    sessionStarted: { type: Date, default: Date.now },
    sessionEnded: Date,
    totalDuration: Number,  // Total conversation time in seconds
    
    // Analytics flags
    isBot: { type: Boolean, default: false },  // Was this conversation initiated by admin bot test?
    tags: [String]          // e.g., ["urgent", "escalated", "feedback-request"]
  },
  { 
    timestamps: true,
    collection: 'chatbot_logs'
  }
);

// Indexes for efficient querying
chatbotLogSchema.index({ userId: 1, createdAt: -1 });
chatbotLogSchema.index({ role: 1, createdAt: -1 });
chatbotLogSchema.index({ topic: 1 });
chatbotLogSchema.index({ 'messages.timestamp': 1 });

// Methods
/**
 * Add a message to the conversation
 */
chatbotLogSchema.methods.addMessage = function(sender, text, metadata = {}) {
  this.messages.push({
    sender,
    text,
    metadata,
    timestamp: new Date()
  });
  return this.save();
};

/**
 * Close the conversation
 */
chatbotLogSchema.methods.closeConversation = function() {
  this.sessionEnded = new Date();
  this.totalDuration = Math.floor((this.sessionEnded - this.sessionStarted) / 1000);
  return this.save();
};

/**
 * Get message count
 */
chatbotLogSchema.methods.getMessageCount = function() {
  return this.messages.length;
};

/**
 * Get last message
 */
chatbotLogSchema.methods.getLastMessage = function() {
  return this.messages[this.messages.length - 1] || null;
};

// Statics
/**
 * Get stats for all conversations
 */
chatbotLogSchema.statics.getStatistics = async function() {
  const stats = await this.aggregate([
    {
      $group: {
        _id: null,
        totalConversations: { $sum: 1 },
        totalMessages: { $sum: { $size: "$messages" } },
        avgMessagesPerConversation: { $avg: { $size: "$messages" } },
        avgSatisfactionRating: { $avg: "$feedbackRating" }
      }
    }
  ]);
  return stats[0] || {};
};

/**
 * Get stats by role
 */
chatbotLogSchema.statics.getStatisticsByRole = async function() {
  return await this.aggregate([
    {
      $group: {
        _id: "$role",
        count: { $sum: 1 },
        totalMessages: { $sum: { $size: "$messages" } },
        avgMessagesPerConversation: { $avg: { $size: "$messages" } }
      }
    },
    { $sort: { count: -1 } }
  ]);
};

/**
 * Get conversations by topic
 */
chatbotLogSchema.statics.getConversationsByTopic = async function(topic) {
  return await this.find({ topic }).sort({ createdAt: -1 });
};

module.exports = mongoose.model("ChatbotLog", chatbotLogSchema);
