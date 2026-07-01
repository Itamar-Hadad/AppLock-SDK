const Developer = require("../models/Developer");

class AccountExistsWithPasswordError extends Error {}

async function findOrCreateDeveloperFromGoogleProfile(profile) {
  const googleId = profile.id;
  const email = profile.emails?.[0]?.value;

  const existingByGoogleId = await Developer.findOne({ googleId });
  if (existingByGoogleId) {
    return existingByGoogleId;
  }

  const existingByEmail = await Developer.findOne({ email });
  if (existingByEmail) {
    throw new AccountExistsWithPasswordError(
      "An account with this email already exists — log in with your password instead"
    );
  }

  return Developer.create({ googleId, email, displayName: profile.displayName });
}

module.exports = { findOrCreateDeveloperFromGoogleProfile, AccountExistsWithPasswordError };