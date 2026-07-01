const WINDOW_MS = 60_000;
const defaultKey = (req) => req.params.appId || req.body.appId;

// 500 requests/min per appId by default (section 6 of the design doc).
function rateLimiter(maxRequestsPerMinute = 500, keyFn = defaultKey) {
  const windows = new Map(); // key -> { count, windowStart }

  return function (req, res, next) {
    const key = keyFn(req);
    const now = Date.now();
    const window = windows.get(key);

    if (!window || now - window.windowStart >= WINDOW_MS) {
      windows.set(key, { count: 1, windowStart: now });
      return next();
    }

    if (window.count >= maxRequestsPerMinute) {
      return res.status(429).json({ error: "Too many requests" });
    }

    window.count += 1;
    next();
  };
}

module.exports = rateLimiter;
