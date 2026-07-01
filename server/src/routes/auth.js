const express = require("express");
const crypto = require("crypto");
const bcrypt = require("bcrypt");
const Developer = require("../models/Developer");
const { validatePassword } = require("../utils/passwordPolicy");
const { setSessionCookie, clearSessionCookie } = require("../utils/sessionToken");
const rateLimiter = require("../middleware/rateLimiter");
const mailer = require("../utils/mailer");
const passport = require("../config/passport");
const requireAuth = require("../middleware/requireAuth");

const router = express.Router();
const LOGIN_RATE_LIMIT_PER_MINUTE = 10;
const loginRateLimiter = rateLimiter(LOGIN_RATE_LIMIT_PER_MINUTE, (req) => req.ip);
const RESET_TOKEN_TTL_MS = 30 * 60 * 1000;
const PORTAL_URL = process.env.PORTAL_URL || "http://localhost:5173";

function respondWithSession(res, status, developer) {
  setSessionCookie(res, developer._id.toString());
  res.status(status).json({
    ownerId: developer._id.toString(),
    email: developer.email,
    displayName: developer.displayName,
  });
}

router.post("/signup", async (req, res) => {
  const { email, password, displayName } = req.body;

  const passwordError = validatePassword(password);
  if (passwordError) {
    return res.status(400).json({ error: passwordError });
  }

  const existing = await Developer.findOne({ email });
  if (existing) {
    return res.status(409).json({ error: "Email already in use" });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const developer = await Developer.create({ email, passwordHash, displayName });

  respondWithSession(res, 201, developer);
});

router.post("/login", loginRateLimiter, async (req, res) => {
  const { email, password } = req.body;

  const developer = await Developer.findOne({ email });
  if (!developer || !developer.passwordHash || !(await bcrypt.compare(password, developer.passwordHash))) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  respondWithSession(res, 200, developer);
});

router.get("/google", passport.authenticate("google", { scope: ["profile", "email"], session: false }));

router.get(
  "/google/callback",
  passport.authenticate("google", { session: false, failureRedirect: `${PORTAL_URL}/login?error=google_failed` }),
  (req, res) => {
    setSessionCookie(res, req.user._id.toString());
    res.redirect(PORTAL_URL);
  }
);

router.post("/password-reset/request", async (req, res) => {
  const { email } = req.body;

  const developer = await Developer.findOne({ email });
  if (developer) {
    const rawToken = crypto.randomBytes(32).toString("hex");
    developer.resetPasswordTokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
    developer.resetPasswordExpiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);
    await developer.save();

    const resetLink = `${PORTAL_URL}/reset-password?token=${rawToken}`;
    await mailer.sendPasswordResetEmail(email, resetLink);
  }

  // Same response whether or not the email is registered, to avoid leaking which emails exist.
  res.status(200).json({ ok: true });
});

router.post("/password-reset/confirm", async (req, res) => {
  const { token, newPassword } = req.body;

  const passwordError = validatePassword(newPassword);
  if (passwordError) {
    return res.status(400).json({ error: passwordError });
  }

  const tokenHash = crypto.createHash("sha256").update(token || "").digest("hex");
  const developer = await Developer.findOne({
    resetPasswordTokenHash: tokenHash,
    resetPasswordExpiresAt: { $gt: new Date() },
  });
  if (!developer) {
    return res.status(400).json({ error: "Invalid or expired reset token" });
  }

  developer.passwordHash = await bcrypt.hash(newPassword, 10);
  developer.resetPasswordTokenHash = undefined;
  developer.resetPasswordExpiresAt = undefined;
  await developer.save();

  res.status(200).json({ ok: true });
});

router.post("/logout", (req, res) => {
  clearSessionCookie(res);
  res.status(200).json({ ok: true });
});

router.get("/me", requireAuth, async (req, res) => {
  const developer = await Developer.findById(req.ownerId);
  res.status(200).json({ email: developer.email, displayName: developer.displayName });
});

module.exports = router;