const passport = require("passport");
const { Strategy: GoogleStrategy } = require("passport-google-oauth20");
const { findOrCreateDeveloperFromGoogleProfile } = require("../services/googleAuth");

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID || "dev-placeholder-client-id",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "dev-placeholder-client-secret",
      callbackURL: process.env.GOOGLE_CALLBACK_URL || "http://localhost:4000/api/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const developer = await findOrCreateDeveloperFromGoogleProfile(profile);
        done(null, developer);
      } catch (err) {
        done(null, false, { message: err.message });
      }
    }
  )
);

module.exports = passport;