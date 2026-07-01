const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const passport = require("./config/passport");
const appsRouter = require("./routes/apps");
const lockEventsRouter = require("./routes/lockEvents");
const authRouter = require("./routes/auth");
const analyticsRouter = require("./routes/analytics");
const alertsRouter = require("./routes/alerts");
const configRouter = require("./routes/config");
const errorsRouter = require("./routes/errors");

function buildApp() {
  const app = express();
  app.use(cors({ origin: process.env.PORTAL_URL, credentials: true }));
  app.use(express.json());
  app.use(cookieParser());
  app.use(passport.initialize());
  app.use("/api/apps", appsRouter);
  app.use("/api/lock", lockEventsRouter);
  app.use("/api/auth", authRouter);
  app.use("/api/analytics", analyticsRouter);
  app.use("/api/alerts", alertsRouter);
  app.use("/api/config", configRouter);
  app.use("/api/errors", errorsRouter);
  return app;
}

module.exports = buildApp;
