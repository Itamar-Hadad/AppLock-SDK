require("dotenv").config();
const mongoose = require("mongoose");
const buildApp = require("./app");
const { connectRedis } = require("./redisClient");

const PORT = process.env.PORT || 4000;

Promise.all([mongoose.connect(process.env.MONGO_URI), connectRedis(process.env.REDIS_URL)]).then(() => {
  buildApp().listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
});