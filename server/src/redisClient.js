const { createClient } = require("redis");

let client = null;

// Test setup injects a redis-memory-server-backed client here instead of connecting to the
// real Redis Cloud instance - same seam pattern as testDb.js does for Mongo.
function setRedisClient(newClient) {
  client = newClient;
}

function getRedisClient() {
  if (!client) {
    throw new Error("Redis client not initialized - call connectRedis() (or setRedisClient() in tests) first");
  }
  return client;
}

async function connectRedis(url) {
  const newClient = createClient({ url });
  await newClient.connect();
  client = newClient;
  return newClient;
}

module.exports = { getRedisClient, setRedisClient, connectRedis };