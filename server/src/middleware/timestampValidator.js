const MAX_AGE_MS = 5 * 60 * 1000;

// Prevents Replay Attacks: rejects requests whose X-Timestamp is more than 5 minutes old.
function timestampValidator(req, res, next) {
  const timestamp = Number(req.get("X-Timestamp"));

  if (!timestamp || Date.now() - timestamp > MAX_AGE_MS) {
    return res.status(401).json({ error: "Missing or stale X-Timestamp" });
  }

  next();
}

module.exports = timestampValidator;
