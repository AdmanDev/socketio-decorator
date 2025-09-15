import { IThrottleStorage } from "../Interfaces/IThrottleStorage"
import { Socket } from "socket.io"

/**
 * Defines the configuration for event throttling.
 */
export type ThrottleConfig = {
	/**
	 * The rate limiting configuration.
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
	 * The throttle data store to use. By default, it uses in-memory storage.
	 */
	store?: new() => IThrottleStorage
	/**
	 * Function to get a custom identifier for the user, used to identify and retrieve user throttle data. If not provided, socket.id will be used.
	 * @param {Socket} socket The socket instance
	 * @returns {string | Promise<string>} A unique identifier for the user
	 */
	getUserIdentifier?: (socket: Socket) => string | Promise<string>
}
