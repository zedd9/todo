import { MongoMemoryServer } from "mongodb-memory-server";
import { afterAll, beforeEach } from "vitest";
import mongoose from "mongoose";

const mongod = await MongoMemoryServer.create();
process.env.MONGODB_URI = mongod.getUri();

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

beforeEach(async () => {
  if (mongoose.connection.readyState === 1 && mongoose.connection.db) {
    const collections = await mongoose.connection.db.collections();
    for (const collection of collections) {
      await collection.deleteMany({});
    }
  }
});
