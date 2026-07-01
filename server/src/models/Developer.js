const mongoose = require("mongoose");

const developerSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String },
  googleId: { type: String },
  displayName: { type: String },
  createdAt: { type: Date, default: Date.now },
  resetPasswordTokenHash: { type: String },
  resetPasswordExpiresAt: { type: Date },
});

module.exports = mongoose.model("Developer", developerSchema, "developers");