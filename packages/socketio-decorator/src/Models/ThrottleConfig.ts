/**
 * Defines the configuration for event throttling.
 */
export type ThrottleConfig = {
	/**
	 * The maximum number of allowed calls within the specified time window.
	 */
	limit: number
	/**
	 * The duration of the time window in milliseconds.
	 */
	timeWindowMs: number
}