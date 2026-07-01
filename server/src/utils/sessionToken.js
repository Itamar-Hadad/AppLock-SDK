const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";
const SESSION_TTL = "7d";
const COOKIE_NAME = "session";
const COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

function signSessionToken(ownerId) {
  return jwt.sign({ ownerId }, JWT_SECRET, { expiresIn: SESSION_TTL });
}

function verifySessionToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

function setSessionCookie(res, ownerId) {
  res.cookie(COOKIE_NAME, signSessionToken(ownerId), {
    httpOnly: true,
    maxAge: COOKIE_MAX_AGE_MS,
  });
}

function clearSessionCookie(res) {
  res.clearCookie(COOKIE_NAME);
}

module.exports = {
  COOKIE_NAME,
  signSessionToken,
  verifySessionToken,
  setSessionCookie,
  clearSessionCookie,
};