const express = require("express");
const App = require("../models/App");
const LockEvent = require("../models/LockEvent");
const Alert = require("../models/Alert");
const requireAuth = require("../middleware/requireAuth");

const router = express.Router();

router.get("/:appId", requireAuth, async (req, res) => {
  const appRecord = await App.findOne({ appId: req.params.appId, ownerId: req.ownerId });
  if (!appRecord) {
    return res.status(404).json({ error: "App not found" });
  }

  const startOfToday = new Date();
  startOfToday.setUTCHours(0, 0, 0, 0);

  const [stats] = await LockEvent.aggregate([
    { $match: { appId: appRecord.appId, timestamp: { $gte: startOfToday } } },
    {
      $group: {
        _id: null,
        unlocksToday: { $sum: { $cond: [{ $eq: ["$event", "UNLOCK_SUCCESS"] }, 1, 0] } },
        failedAttemptsToday: { $sum: { $cond: [{ $eq: ["$event", "UNLOCK_FAILED"] }, 1, 0] } },
        biometricUnlocksToday: {
          $sum: { $cond: [{ $and: [{ $eq: ["$event", "UNLOCK_SUCCESS"] }, { $eq: ["$method", "biometric"] }] }, 1, 0] },
        },
      },
    },
  ]);

  const unlocksToday = stats?.unlocksToday ?? 0;
  const biometricUnlocksToday = stats?.biometricUnlocksToday ?? 0;

  const hourlyBuckets = await LockEvent.aggregate([
    { $match: { appId: appRecord.appId, event: "UNLOCK_SUCCESS", timestamp: { $gte: startOfToday } } },
    { $group: { _id: { $hour: "$timestamp" }, count: { $sum: 1 } } },
  ]);
  const hourlyUnlocks = Array(24).fill(0);
  for (const bucket of hourlyBuckets) {
    hourlyUnlocks[bucket._id] = bucket.count;
  }

  const startOfTrendWindow = new Date(startOfToday);
  startOfTrendWindow.setUTCDate(startOfTrendWindow.getUTCDate() - 6);

  const dailyTrend = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startOfTrendWindow);
    d.setUTCDate(d.getUTCDate() + i);
    return { date: d.toISOString().slice(0, 10), unlocks: 0 };
  });
  const methodBreakdown = { pin: 0, pattern: 0, biometric: 0 };

  const trendEvents = await LockEvent.find(
    { appId: appRecord.appId, event: "UNLOCK_SUCCESS", timestamp: { $gte: startOfTrendWindow } },
    { timestamp: 1, method: 1 }
  );
  for (const event of trendEvents) {
    const dateStr = event.timestamp.toISOString().slice(0, 10);
    const bucket = dailyTrend.find((entry) => entry.date === dateStr);
    if (bucket) bucket.unlocks += 1;
    if (event.method in methodBreakdown) methodBreakdown[event.method] += 1;
  }

  const openAlerts = await Alert.find({ appId: appRecord.appId, status: "OPEN" }, { deviceId: 1, failCount: 1, lastSeen: 1 })
    .sort({ lastSeen: -1 })
    .lean();
  const suspiciousDevices = openAlerts.map((alert) => ({
    deviceId: alert.deviceId,
    failCount: alert.failCount,
    lastSeen: alert.lastSeen,
  }));

  res.status(200).json({
    unlocksToday,
    failedAttemptsToday: stats?.failedAttemptsToday ?? 0,
    biometricPercentage: unlocksToday === 0 ? 0 : Math.round((biometricUnlocksToday / unlocksToday) * 100),
    hourlyUnlocks,
    dailyTrend,
    methodBreakdown,
    suspiciousDevices,
  });
});

module.exports = router;