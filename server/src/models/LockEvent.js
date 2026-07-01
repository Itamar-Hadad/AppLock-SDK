const mongoose = require("mongoose");

const lockEventSchema = new mongoose.Schema({
  appId: { type: String, required: true },
  deviceId: { type: String, required: true },
  event: { type: String, required: true },
  method: { type: String, required: true },
  attempt: { type: Number, required: true },
  timestamp: { type: Date, required: true },
  sdkVersion: { type: String, required: true },
  osVersion: { type: String, required: true },
  manufacturer: { type: String, required: true },
  model: { type: String, required: true },
  sdkInt: { type: Number, required: true },
  language: { type: String, required: true },
  appVersion: { type: String, required: true },
});

// Analytics queries by appId + time.
lockEventSchema.index({ appId: 1, timestamp: -1 });
// Detect suspicious devices - failed count per device.
lockEventSchema.index({ appId: 1, deviceId: 1, event: 1, timestamp: -1 });
// Auto-delete events older than 90 days.
lockEventSchema.index({ timestamp: 1 }, { expireAfterSeconds: 7776000 });

module.exports = mongoose.model("LockEvent", lockEventSchema, "lock_events");
