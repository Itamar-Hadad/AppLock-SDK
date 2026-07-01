const LockEvent = require("../models/LockEvent");
const Alert = require("../models/Alert");
const Config = require("../models/Config");
const fcm = require("../utils/fcm");

const WINDOW_MS = 24 * 60 * 60 * 1000;

async function checkSuspiciousDevice({ appId, deviceId, timestamp }) {
  const windowStart = new Date(new Date(timestamp).getTime() - WINDOW_MS);

  const [stats, config] = await Promise.all([
    LockEvent.aggregate([
      { $match: { appId, deviceId, event: "UNLOCK_FAILED", timestamp: { $gte: windowStart } } },
      { $group: { _id: null, count: { $sum: 1 }, firstSeen: { $min: "$timestamp" }, lastSeen: { $max: "$timestamp" } } },
    ]).then((rows) => rows[0]),
    Config.findOne({ appId }),
  ]);
  const alertThreshold = config?.alertThreshold ?? Config.CONFIG_DEFAULTS.alertThreshold;

  if (!stats || stats.count < alertThreshold) return;

  // Concurrent failed-attempt reports for the same device can reach here at the same time
  // (e.g. several rapid-fire wrong PINs) - findOne-then-create would let more than one of
  // them see "no alert yet" and each create their own. The unique partial index on Alert
  // (appId+deviceId, status=OPEN) is what actually prevents that: only one concurrent
  // create() can win; the rest get a duplicate-key error and fall back to updating it instead.
  try {
    const alert = await Alert.create({ appId, deviceId, failCount: stats.count, firstSeen: stats.firstSeen, lastSeen: stats.lastSeen, status: "OPEN" });
    await fcm.sendSuspiciousDeviceAlert(alert);
  } catch (err) {
    if (err.code !== 11000) throw err;
    await Alert.updateOne({ appId, deviceId, status: "OPEN" }, { failCount: stats.count, lastSeen: stats.lastSeen });
  }
}

module.exports = { checkSuspiciousDevice };