const mongoose = require('mongoose');
const { env } = require('./env');
const logger = require('../utils/logger');

async function connectDB() {
  if (!env.MONGODB_URI) {
    throw new Error('MONGODB_URI is required');
  }

  mongoose.set('strictQuery', true);

  const connection = await mongoose.connect(env.MONGODB_URI, {
    autoIndex: env.NODE_ENV !== 'production'
  });

  logger.info(`MongoDB connected: ${connection.connection.host}`);
  return connection;
}

module.exports = connectDB;
