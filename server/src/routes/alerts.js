const express = require("express");
const App = require("../models/App");
const Alert = require("../models/Alert");
const requireAuth = require("../middleware/requireAuth");

const router = express.Router();

router.get("/:appId", requireAuth, async (req, res) => {
  const appRecord = await App.findOne({ appId: req.params.appId, ownerId: req.ownerId });
  if (!appRecord) {
    return res.status(404).json({ error: "App not found" });
  }

  const alerts = await Alert.find({ appId: appRecord.appId }).sort({ lastSeen: -1 });

  res.status(200).json(alerts);
});

router.patch("/:appId/:alertId", requireAuth, async (req, res) => {
  const appRecord = await App.findOne({ appId: req.params.appId, ownerId: req.ownerId });
  if (!appRecord) {
    return res.status(404).json({ error: "App not found" });
  }

  if (!["HANDLED", "IGNORED"].includes(req.body.status)) {
    return res.status(400).json({ error: "status must be HANDLED or IGNORED" });
  }

  const alert = await Alert.findOneAndUpdate(
    { _id: req.params.alertId, appId: appRecord.appId },
    { status: req.body.status },
    { returnDocument: "after" }
  );
  if (!alert) {
    return res.status(404).json({ error: "Alert not found" });
  }

  res.status(200).json(alert);
});

module.exports = router;