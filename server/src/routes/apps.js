const express = require("express");
const crypto = require("crypto");
const bcrypt = require("bcrypt");
const App = require("../models/App");
const LockEvent = require("../models/LockEvent");
const requireAuth = require("../middleware/requireAuth");

const router = express.Router();

router.post("/", requireAuth, async (req, res) => {
  const { name, packageName } = req.body;

  const appId = `app_${crypto.randomBytes(8).toString("hex")}`;
  const apiKey = crypto.randomBytes(24).toString("hex");
  const apiKeyHash = await bcrypt.hash(apiKey, 10);

  await App.create({ appId, apiKey: apiKeyHash, name, packageName, ownerId: req.ownerId });

  res.status(201).json({ appId, apiKey });
});

router.get("/", requireAuth, async (req, res) => {
  const apps = await App.find({ ownerId: req.ownerId }, { apiKey: 0 });

  const startOfToday = new Date();
  startOfToday.setUTCHours(0, 0, 0, 0);
  const stats = await LockEvent.aggregate([
    { $match: { appId: { $in: apps.map((app) => app.appId) } } },
    { $sort: { timestamp: -1 } },
    {
      $group: {
        _id: "$appId",
        lastSdkVersion: { $first: "$sdkVersion" },
        requestsToday: { $sum: { $cond: [{ $gte: ["$timestamp", startOfToday] }, 1, 0] } },
      },
    },
  ]);
  const statsByAppId = Object.fromEntries(stats.map((s) => [s._id, s]));

  res.status(200).json(
    apps.map((app) => ({
      ...app.toObject(),
      revokedAt: undefined,
      revoked: Boolean(app.revokedAt),
      requestsToday: statsByAppId[app.appId]?.requestsToday ?? 0,
      lastSdkVersion: statsByAppId[app.appId]?.lastSdkVersion ?? null,
    }))
  );
});

router.post("/:appId/revoke", requireAuth, async (req, res) => {
  const appRecord = await App.findOne({ appId: req.params.appId, ownerId: req.ownerId });
  if (!appRecord) {
    return res.status(404).json({ error: "App not found" });
  }

  appRecord.revokedAt = new Date();
  await appRecord.save();

  res.status(200).json({ appId: appRecord.appId, revoked: true });
});

module.exports = router;
