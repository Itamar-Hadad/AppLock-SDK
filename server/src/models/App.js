const mongoose = require("mongoose");

const appSchema = new mongoose.Schema({
  appId: { type: String, required: true, unique: true },
  apiKey: { type: String, required: true },
  name: { type: String, required: true },
  packageName: { type: String, required: true },
  ownerId: { type: String },
  createdAt: { type: Date, default: Date.now },
  revokedAt: { type: Date, default: null },
});

module.exports = mongoose.model("App", appSchema, "apps");
