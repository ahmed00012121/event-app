const mongoose = require("mongoose");
require("dotenv").config(); // Load .env variables

const connectDB = async (retries = 5) => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000, // 5 seconds to select server
      socketTimeoutMS: 45000, // 45 seconds for operations
      connectTimeoutMS: 10000, // 10 seconds to establish connection
      heartbeatFrequencyMS: 2000, // Check connection every 2 seconds
    });

    // Handle disconnection gracefully
    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected! Attempting to reconnect...');
      if (retries > 0) {
        setTimeout(() => connectDB(retries - 1), 5000);
      }
    });

    console.log(`✅ MongoDB connected: ${conn.connection.host}`);
    return conn;
  } catch (err) {
    console.error(`❌ MongoDB connection error: ${err.message}`);
    if (retries > 0) {
      console.log(`Retrying connection... (${retries} attempts left)`);
      await new Promise(resolve => setTimeout(resolve, 5000));
      return connectDB(retries - 1);
    } else {
      process.exit(1);
    }
  }
};

module.exports = connectDB;
