// Real Firebase Cloud Messaging project/credentials are out of scope for this slice (issue #14) -
// this stub stands in for the real push so the call site and tests have a stable interface to depend on.
async function sendSuspiciousDeviceAlert(alert) {
  console.log(`[FCM] Suspicious device alert: app=${alert.appId} device=${alert.deviceId} failCount=${alert.failCount}`);
}

module.exports = { sendSuspiciousDeviceAlert };