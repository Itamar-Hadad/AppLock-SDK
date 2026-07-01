const { COOKIE_NAME, verifySessionToken } = require("../utils/sessionToken");

function requireAuth(req, res, next) {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  try {
    req.ownerId = verifySessionToken(token).ownerId;
  } catch {
    return res.status(401).json({ error: "Not authenticated" });
  }

  next();
}

module.exports = requireAuth;