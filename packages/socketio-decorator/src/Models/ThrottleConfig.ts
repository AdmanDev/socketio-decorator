import { IThrottleStorage } from "../Interfaces/IThrottleStorage"

/**
 * Defines the configuration for event throttling.
 */
export type ThrottleConfig = {
	/**
	 * The throttle rate limiting configuration.
	 */
	rateLimitConfig?: {
		/**
		 * The maximum number of allowed calls within the specified time window.
		 */
		limit: number
		/**
		 * The duration of the time window in milliseconds.
		 */
		timeWindowMs: number
	}
	/**
	 * Interval in milliseconds to perform periodic cleanup of expired throttle data. Default is 3600000 (1 hour).
	 */
	cleanupIntervalMs?: number
	/**
	 * The throttle data store to use. Defaults to InMemoryThrottleStore.
	 */
	store?: new() => IThrottleStorage
}