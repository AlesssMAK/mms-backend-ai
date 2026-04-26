import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { invalidateCache as invalidateSettingsCache } from '../../src/services/systemSettings.js';

let mongod = null;

/**
 * Boot an in-memory Mongo instance and connect Mongoose to it.
 * Idempotent — repeated calls within the same worker reuse the server.
 */
export const startInMemoryMongo = async () => {
  if (mongod) return mongod.getUri();
  mongod = await MongoMemoryServer.create({ binary: { version: '7.0.14' } });
  const uri = mongod.getUri();
  process.env.MONGO_URL = uri;
  await mongoose.connect(uri);
  return uri;
};

export const stopInMemoryMongo = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  if (mongod) {
    await mongod.stop();
    mongod = null;
  }
};

/**
 * Wipe every collection between tests. Faster than restarting the server
 * and keeps indexes intact.
 */
export const clearDatabase = async () => {
  if (mongoose.connection.readyState !== 1) return;
  const collections = await mongoose.connection.db.collections();
  await Promise.all(collections.map((c) => c.deleteMany({})));
  invalidateSettingsCache();
};
