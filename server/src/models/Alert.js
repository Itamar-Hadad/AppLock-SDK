const mongoose = require("mongoose");

const alertSchema = new mongoose.Schema({
  appId: { type: String, required: true },
  deviceId: { type: String, required: true },
  failCount: { type: Number, required: true },
  firstSeen: { type: Date, required: true },
  lastSeen: { type: Date, required: true },
  status: { type: String, required: true, default: "OPEN" },
});

// Suspicious Device Check dedup: at most one OPEN alert per device, enforced atomically by
// MongoDB itself (not just application logic) - concurrent failed-attempt reports for the
// same device race to create this, and only a real unique index stops both from winning.
alertSchema.index({ appId: 1, deviceId: 1 }, { unique: true, partialFilterExpression: { status: "OPEN" } });

module.exports = mongoose.model("Alert", alertSchema, "alerts");