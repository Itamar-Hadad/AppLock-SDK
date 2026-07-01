const nodemailer = require("nodemailer");

function buildTransport() {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });
}

async function sendPasswordResetEmail(to, resetLink) {
  const transport = buildTransport();
  await transport.sendMail({
    from: process.env.GMAIL_USER,
    to,
    subject: "AppLock SDK Portal — Password Reset",
    text: `Reset your password by visiting: ${resetLink}\n\nThis link expires in 30 minutes.`,
  });
}

module.exports = { sendPasswordResetEmail };