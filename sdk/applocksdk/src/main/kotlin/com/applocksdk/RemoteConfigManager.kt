package com.applocksdk

/**
 * Decides whether the locally cached remote config is still within its 10-minute TTL, and
 * fetches a fresh one from the server otherwise - same "fetch in background, never block the
 * host app" philosophy as [AppLockEngine.report]. A failed fetch falls back to whatever was
 * last cached (or null, meaning [AppLockSDK] keeps using the config passed to init()).
 *
 * On every call, also checks the cheap priority-update flag (issue #18) regardless of the
 * TTL - a pending security-sensitive change (maxAttempts, lockoutSeconds, a disabled lock
 * method) forces an immediate full fetch even when the cached config is still fresh. A failed
 * priority check is treated the same as "nothing pending", deferring to the normal TTL.
 */
internal class RemoteConfigManager(
    private val api: AppLockApi,
    private val appId: String,
    private val cache: RemoteConfigCache,
    private val clock: () -> Long = System::currentTimeMillis,
) {
    companion object {
        const val TTL_MILLIS = 10 * 60 * 1000L
    }

    suspend fun getEffectiveConfig(): CachedRemoteConfig? {
        val priorityPending = try {
            api.getPriorityStatus(appId).pending
        } catch (e: Exception) {
            false
        }

        val cached = cache.read()
        if (!priorityPending && cached != null && clock() - cached.fetchedAtMillis < TTL_MILLIS) {
            return cached
        }

        return try {
            val response = api.getConfig(appId)
            val fresh = CachedRemoteConfig(
                fetchedAtMillis = clock(),
                maxAttempts = response.maxAttempts,
                lockoutSeconds = response.lockoutSeconds,
                timeoutSeconds = response.timeoutSeconds,
                methods = response.methods,
            )
            cache.save(fresh)
            fresh
        } catch (e: Exception) {
            cached
        }
    }
}