const express = require("express");
const validateApiKey = require("../middleware/validateApiKey");
const rateLimiter = require("../middleware/rateLimiter");
const timestampValidator = require("../middleware/timestampValidator");
const LockEvent = require("../models/LockEvent");
const { checkSuspiciousDevice } = require("../services/suspiciousDeviceCheck");

const router = express.Router();

router.post("/event", validateApiKey, rateLimiter(), timestampValidator, async (req, res) => {
  const event = await LockEvent.create(req.body);
  res.status(201).json({ ok: true });

  if (event.event === "UNLOCK_FAILED") {
    checkSuspiciousDevice(event).catch((err) => console.error("Suspicious device check failed:", err));
  }
});

module.exports = router;
