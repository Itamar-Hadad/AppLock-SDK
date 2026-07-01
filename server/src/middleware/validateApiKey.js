const bcrypt = require("bcrypt");
const App = require("../models/App");

// ADR-0002: look up the single `apps` record by `appId` (indexed, O(1)), then
// bcrypt-compare `apiKey` only against that one record's hash.
async function validateApiKey(req, res, next) {
  const appId = req.params.appId || req.body.appId;
  const apiKey = req.get("X-Api-Key");

  if (!appId || !apiKey) {
    return res.status(401).json({ error: "Missing appId or X-Api-Key" });
  }

  const appRecord = await App.findOne({ appId });
  if (!appRecord || appRecord.revokedAt || !(await bcrypt.compare(apiKey, appRecord.apiKey))) {
    return res.status(401).json({ error: "Invalid appId or apiKey" });
  }

  req.appRecord = appRecord;
  next();
}

module.exports = validateApiKey;
