require('dotenv').config();
const mongoose = require('mongoose');

// Use environment variables directly - no Docker detection needed
// The .env file should contain the correct URI for the environment (with host.docker.internal for Docker)
const MONGO_URI = process.env.MONGO_URI; // For qbit-chat database
const MONGO_OPS_URI = process.env.MONGO_OPS_URI; // Separate DB for ops

if (!MONGO_URI) {
  throw new Error('Please define the MONGO_URI environment variable');
}

if (!MONGO_OPS_URI) {
  throw new Error('Please define the MONGO_OPS_URI environment variable');
}

/**
 * Global cache for database connections
 */
let cached = global.mongoose;
let cachedOps = global.mongooseOps;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

if (!cachedOps) {
  cachedOps = global.mongooseOps = { conn: null, promise: null };
}

/**
 * Connect to qbit-chat database (for User, Organisation, Session models)
 */
async function connectDb() {
  if (cached.conn && cached.conn?._readyState === 1) {
    return cached.conn;
  }

  const disconnected = cached.conn && cached.conn?._readyState !== 1;
  if (!cached.promise || disconnected) {
    const opts = {
      bufferCommands: false,
    };

    mongoose.set('strictQuery', true);
    const conn = mongoose.createConnection(MONGO_URI, opts);
    cached.promise = new Promise((resolve, reject) => {
      conn.once('connected', () => {
        console.log('MongoDB Connected (qbit-chat)');
        resolve(conn);
      });
      conn.once('error', reject);
    });
  }
  cached.conn = await cached.promise;
  return cached.conn;
}

/**
 * Connect to qbit-ops database (for Admin and ops-specific models)
 */
async function connectOpsDb() {
  if (cachedOps.conn && cachedOps.conn?._readyState === 1) {
    return cachedOps.conn;
  }

  const disconnected = cachedOps.conn && cachedOps.conn?._readyState !== 1;
  if (!cachedOps.promise || disconnected) {
    const opts = {
      bufferCommands: false,
    };
    console.log('MONGO_OPS_URI', MONGO_OPS_URI);
    const conn = mongoose.createConnection(MONGO_OPS_URI, opts);
    cachedOps.promise = new Promise((resolve, reject) => {
      conn.once('connected', () => {
        console.log('MongoDB Connected (qbit-ops)');
        resolve(conn);
      });
      conn.once('error', reject);
    });
  }
  cachedOps.conn = await cachedOps.promise;
  return cachedOps.conn;
}

/**
 * Connect to both databases
 */
async function connectDatabases() {
  await Promise.all([connectDb(), connectOpsDb()]);
}

module.exports = {
  connectDb,
  connectOpsDb,
  connectDatabases,
};