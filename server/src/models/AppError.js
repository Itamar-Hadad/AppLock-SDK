const mongoose = require("mongoose");

const appErrorSchema = new mongoose.Schema({
  appId: { type: String, required: true },
  deviceId: { type: String },
  error: { type: String, required: true },
  timestamp: { type: Date, required: true },
  sdkVersion: { type: String },
});

appErrorSchema.index({ appId: 1, timestamp: -1 });
// Auto-delete error reports older than 90 days.
appErrorSchema.index({ timestamp: 1 }, { expireAfterSeconds: 7776000 });

module.exports = mongoose.model("AppError", appErrorSchema, "errors");