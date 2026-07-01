# AppLock SDK Demo — Private Notes

A small Android app ("Private Notes") that demonstrates the AppLock SDK in action for the
seminar presentation. Not part of the documented product — see `CONTEXT.md`'s "Demo App" entry.

## One-time setup: publish the SDK locally

This app consumes the SDK as a real Maven dependency (`com.applocksdk:applocksdk:1.0.0`)
resolved from your local Maven repository, not a Gradle composite build (see
`docs/adr/0003-demo-app-consumes-sdk-via-maven-local-publish.md`). Before running the demo for
the first time, and again any time the SDK's source code changes:

```
cd ../sdk
./gradlew :applocksdk:publishToMavenLocal
```

Wait for `BUILD SUCCESSFUL`. This writes the SDK artifact to `~/.m2/repository/com/applocksdk/`.

## One-time setup: register the demo app through the Portal

The demo authenticates against the server with a real `appId`/`apiKey` pair, the same way any
third-party app integrating the SDK would (see issue #08). These are not hardcoded:

1. Run the server (`cd ../server && npm start`) and the Portal (`cd ../portal && npm run dev`).
2. Sign up/log in to the Portal and register an app (e.g. name "AppLock Demo - Private Notes",
   package `com.applocksdk.demo`).
3. Copy the one-time `appId`/`apiKey` shown into `demo/local.properties` (gitignored, alongside
   the existing `sdk.dir` line):
   ```
   applock.appId=<your appId>
   applock.apiKey=<your apiKey>
   ```
4. Sync Gradle — these are read into `BuildConfig.APPLOCK_APP_ID`/`BuildConfig.APPLOCK_API_KEY`
   and used by `DemoApplication.onCreate()`'s `AppLockSDK.init()` call.

If `local.properties` has no `applock.*` lines yet, the `BuildConfig` fields default to an empty
string and SDK event-reporting calls will 401 against a real server.

## Optional: pointing at a local dev server instead of production

By default the SDK talks to its production server. To test against a server running on your own
machine (`cd ../server && npm start`), add to `demo/local.properties`:
```
applock.baseUrl=http://<your machine's LAN IP>:4000/
```
The phone and computer must be on the same Wi-Fi network (find the IP via System Settings >
Wi-Fi, or `ipconfig getifaddr en0` on macOS). Leave this line out (or empty) to use the
production default. This is read by `initAppLock()` in `DemoApplication.kt`, which every
Control Panel button also calls — see `AppLockSDK.kt`'s advanced `init(..., baseUrl)` overload.

## Running the demo

1. Open this `demo/` folder as its own project in Android Studio (not the `sdk/` folder, and
   not the repo root — `demo/` is a separate top-level Gradle project).
2. Let Gradle sync.
3. Run on an emulator or device (minSdk 26).

## What it shows

- **Notes list** (launch screen): 4 hardcoded notes with sensitive-sounding titles. Tapping one
  calls the real `AppLockSDK.lock()` and shows the SDK's own PIN entry screen before revealing
  the note's content.
- **Presenter Control Panel**: a demo-only debug screen (reachable from a button on the Notes
  list) with controls — Set Up Lock, Lock Now, Reset — calling the real `AppLockSDK` public API
  directly. Not an end-user settings screen; lock configuration is developer/Portal-controlled,
  never end-user-chosen. `maxAttempts`/`lockoutSeconds`/`timeoutSeconds`/`alertThreshold`/enabled
  methods all come from the real Portal Config Editor (`/apps/:appId/config`). "Set Up Lock"
  adapts automatically to whatever method (PIN/Pattern/Biometric) the current config has enabled.

## Config propagation paths (issue #18)

Every launch, the SDK checks `GET /api/config/:appId/priority` before consulting its 10-minute
local cache. There are two paths:

**Normal path (non-security fields: `timeoutSeconds`, `alertThreshold`)**
→ The local cache is respected for up to 10 minutes.
→ Demo: change `timeoutSeconds` in the Portal Config Editor, relaunch — the old value is still in
  effect. Relaunch again after the TTL window to see the new value. (For a live demo, explain this
  rather than waiting 10 minutes.)

**Priority path (security-sensitive fields: `maxAttempts`, `lockoutSeconds`, disabling a method)**
→ The server marks a `priorityUpdatePending` flag; the next SDK launch fetches fresh config
  immediately, bypassing the local cache regardless of age.
→ Demo: set `maxAttempts` to 1 in the Portal Config Editor → kill and relaunch the demo app →
  Control Panel → Set Up Lock → enter PIN twice → Lock Now → enter one wrong PIN → locked out
  immediately (one attempt instead of five). No need to wait for any TTL.

To reset between demo runs: Reset in the Control Panel clears attempt count; to restore a higher
`maxAttempts`, save it in the Portal and relaunch.