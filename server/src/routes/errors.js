const express = require("express");
const validateApiKey = require("../middleware/validateApiKey");
const AppError = require("../models/AppError");

const router = express.Router();

router.post("/", validateApiKey, async (req, res) => {
  const { appId, deviceId, error, timestamp, sdkVersion } = req.body;
  if (!appId || !error) {
    return res.status(400).json({ error: "appId and error are required" });
  }
  await AppError.create({ appId, deviceId, error, timestamp: new Date(timestamp), sdkVersion });
  res.status(201).json({ ok: true });
});

module.exports = router;