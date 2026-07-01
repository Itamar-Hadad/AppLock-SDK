const mongoose = require("mongoose");

// Shared with routes/config.js, which returns these exact values for any appId that has
// never had a config saved - must match the SDK's own AppLockConfig defaults and the
// previously-hardcoded ALERT_THRESHOLD in suspiciousDeviceCheck.js, so an app with no saved
// config keeps behaving exactly as it did before this collection existed.
const CONFIG_DEFAULTS = {
  maxAttempts: 5,
  lockoutSeconds: 30,
  timeoutSeconds: 30,
  alertThreshold: 3,
  methods: ["pin"],
};

const configSchema = new mongoose.Schema({
  appId: { type: String, required: true, unique: true },
  maxAttempts: { type: Number, default: CONFIG_DEFAULTS.maxAttempts },
  lockoutSeconds: { type: Number, default: CONFIG_DEFAULTS.lockoutSeconds },
  timeoutSeconds: { type: Number, default: CONFIG_DEFAULTS.timeoutSeconds },
  alertThreshold: { type: Number, default: CONFIG_DEFAULTS.alertThreshold },
  methods: { type: [String], default: CONFIG_DEFAULTS.methods },
  updatedAt: { type: Date, default: Date.now },
  // Set by routes/config.js's PUT on a security-sensitive field change (maxAttempts,
  // lockoutSeconds, disabling a lock method); cleared by GET /:appId/priority once
  // it delivers a pending=true to the SDK (issue #18).
  priorityUpdatePending: { type: Boolean, default: false },
});

const Config = mongoose.model("Config", configSchema, "configs");

module.exports = Config;
module.exports.CONFIG_DEFAULTS = CONFIG_DEFAULTS;