const express = require("express");
const Config = require("../models/Config");
const App = require("../models/App");
const validateApiKey = require("../middleware/validateApiKey");
const requireAuth = require("../middleware/requireAuth");
const { getRedisClient } = require("../redisClient");

const router = express.Router();

const CACHE_TTL_SECONDS = 10 * 60;

function cacheKey(appId) {
  return `config:${appId}`;
}

function toPublicConfig(doc) {
  return {
    maxAttempts: doc.maxAttempts,
    lockoutSeconds: doc.lockoutSeconds,
    timeoutSeconds: doc.timeoutSeconds,
    alertThreshold: doc.alertThreshold,
    methods: doc.methods,
  };
}

// Two callers share this one documented endpoint, each with their own credential: the SDK
// (X-Api-Key, no ownership check needed - the key itself scopes it to one app) and the
// Portal (session cookie, ownership-scoped) reading the current values before a Config
// Editor save. Dispatches on which credential is present rather than splitting into two
// routes, so the URL/method stays exactly as documented in files/AppLock_SDK_EN.md §6.
function authenticateConfigRead(req, res, next) {
  if (req.get("X-Api-Key")) {
    return validateApiKey(req, res, next);
  }
  return requireAuth(req, res, next);
}

router.get("/:appId", authenticateConfigRead, async (req, res) => {
  if (!req.appRecord) {
    const appRecord = await App.findOne({ appId: req.params.appId, ownerId: req.ownerId });
    if (!appRecord) {
      return res.status(404).json({ error: "App not found" });
    }
  }

  const redis = getRedisClient();
  const key = cacheKey(req.params.appId);

  const cached = await redis.get(key);
  if (cached) {
    return res.status(200).json(JSON.parse(cached));
  }

  const config = await Config.findOne({ appId: req.params.appId });
  const publicConfig = config ? toPublicConfig(config) : Config.CONFIG_DEFAULTS;

  await redis.set(key, JSON.stringify(publicConfig), { EX: CACHE_TTL_SECONDS });
  res.status(200).json(publicConfig);
});

// SDK-only, checked on every app launch regardless of the local 10-minute TTL (issue #18) -
// deliberately separate from the full config above (and never Redis-cached) so a launch that
// finds nothing pending costs one tiny indexed Mongo lookup, not a full document fetch.
// Read-and-clear in one atomic op: a pending flag is only ever delivered once.
router.get("/:appId/priority", validateApiKey, async (req, res) => {
  const cleared = await Config.findOneAndUpdate(
    { appId: req.params.appId, priorityUpdatePending: true },
    { priorityUpdatePending: false }
  );

  res.status(200).json({ pending: cleared !== null });
});

// Portal-facing, session-authenticated - same ownership-scoping pattern as alerts.js/analytics.js.
router.put("/:appId", requireAuth, async (req, res) => {
  const appRecord = await App.findOne({ appId: req.params.appId, ownerId: req.ownerId });
  if (!appRecord) {
    return res.status(404).json({ error: "App not found" });
  }

  const { maxAttempts, lockoutSeconds, timeoutSeconds, alertThreshold, methods } = req.body;
  const existing = await Config.findOne({ appId: appRecord.appId });
  const previous = existing ? toPublicConfig(existing) : Config.CONFIG_DEFAULTS;
  const disablesAMethod = previous.methods.some((method) => !methods.includes(method));
  const isSecuritySensitiveChange =
    maxAttempts !== previous.maxAttempts || lockoutSeconds !== previous.lockoutSeconds || disablesAMethod;
  const priorityUpdatePending = Boolean(existing?.priorityUpdatePending) || isSecuritySensitiveChange;

  const config = await Config.findOneAndUpdate(
    { appId: appRecord.appId },
    { maxAttempts, lockoutSeconds, timeoutSeconds, alertThreshold, methods, priorityUpdatePending, updatedAt: new Date() },
    { upsert: true, returnDocument: "after", runValidators: true }
  );

  await getRedisClient().del(cacheKey(appRecord.appId));

  res.status(200).json(toPublicConfig(config));
});

module.exports = router;