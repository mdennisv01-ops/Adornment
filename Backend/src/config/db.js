const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const env = require('./env');
const logger = require('./logger');
const { Category, Staff } = require('../models');
const { hashPassword } = require('../utils/password');

mongoose.set('strictQuery', true);

let connectPromise = null;
let memoryServer = null;

async function ensureDevelopmentSeed() {
  if (env.nodeEnv === 'production') return;

  const categories = [
    { name: 'Gowns', slug: 'gowns' },
    { name: 'Suits', slug: 'suits' },
    { name: 'Jumpsuit', slug: 'jumpsuit' },
    { name: '2-Piece', slug: '2-piece' },
    { name: 'Summer', slug: 'summer' },
    { name: 'Collars & Ties', slug: 'collars-ties' },
  ];

  for (const category of categories) {
    await Category.findOneAndUpdate({ slug: category.slug }, category, { upsert: true, new: true });
  }

  // Local first-run owner setup is opt-in via environment variables. Never
  // replace an existing account, and do not permit temporary credentials in
  // production (the production branch above returns before this code).
  const ownerEmail = process.env.OWNER_EMAIL;
  const ownerPassword = process.env.OWNER_PASSWORD;
  const temporary = process.env.OWNER_FORCE_PASSWORD_RESET === 'true';
  if (ownerEmail && ownerPassword && temporary) {
    let owner = await Staff.findOne({ email: ownerEmail.toLowerCase() });
    if (!owner) {
      const username = (process.env.OWNER_USERNAME || 'Admin').trim().toLowerCase();
      owner = await Staff.create({
        name: process.env.OWNER_NAME || 'Admin',
        username,
        email: ownerEmail,
        passwordHash: await hashPassword(ownerPassword),
        role: 'OWNER',
        mustChangePassword: true,
      });
      logger.info(`Created local owner account for username: ${username}`);
    }
  }

}

function shouldUseMemoryFallback(uri) {
  if (env.nodeEnv === 'production') return false;
  if (!uri) return true;
  return /localhost:27017|127\.0\.0\.1:27017/.test(uri);
}

async function connectDB() {
  if (connectPromise) return connectPromise;

  connectPromise = (async () => {
    try {
      const conn = await mongoose.connect(env.mongodbUri);
      logger.info(`MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);
      await ensureDevelopmentSeed();
      return conn;
    } catch (err) {
      if (!shouldUseMemoryFallback(env.mongodbUri)) {
        logger.error({ err }, 'MongoDB connection failed');
        process.exit(1);
      }

      logger.warn(
        { err },
        'MongoDB is not running at the configured local URI; starting an in-memory MongoDB instance for local development.'
      );

      memoryServer = await MongoMemoryServer.create();
      const conn = await mongoose.connect(memoryServer.getUri());
      logger.info(`MongoDB connected via in-memory server: ${conn.connection.host}/${conn.connection.name}`);
      await ensureDevelopmentSeed();
      return conn;
    }
  })();

  return connectPromise;
}

async function closeDB() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close(false);
  }

  if (memoryServer) {
    await memoryServer.stop();
    memoryServer = null;
  }
}

mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB disconnected');
});

module.exports = { connectDB, closeDB, mongoose };
