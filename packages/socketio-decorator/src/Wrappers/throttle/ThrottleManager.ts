import { SiodThrottleError } from "../../Models/Errors/SiodThrottleError"

/**
 * Manages throttling state and checks for all socket events
 */
export class ThrottleManager {
	private static store = new Map<string, Map<string, {
		count: number
		resetTime: number
	}>>()

	/**
	 * Check if a request should be throttled
	 * @param {string} socketId The socket ID
	 * @param {string} eventName The event name
	 * @param {number} limit Maximum requests allowed
	 * @param {number} windowMs Time window in milliseconds
	 * @returns {Promise<void>} Promise that resolves if the request is allowed, rejects with ThrottleError if throttled
	 */
	public static async checkThrottle (
		socketId: string,
		eventName: string,
		limit: number,
		windowMs: number
	): Promise<void> {
		const now = Date.now()

		const socketStore = this.store.get(socketId) || new Map()
		const eventData = socketStore.get(eventName)

		if (!eventData || eventData.resetTime <= now) {
			socketStore.set(eventName, {
				count: 1,
				resetTime: now + windowMs
			})
			this.store.set(socketId, socketStore)
			return
		}

		if (eventData.count >= limit) {
			const remainingTime = eventData.resetTime - now
			throw new SiodThrottleError(remainingTime)
		}

		eventData.count++
		socketStore.set(eventName, eventData)
	}

	/**
	 * Clean up expired throttle data
	 */
	public static cleanup (): void {
		const now = Date.now()
		for (const [socketId, socketStore] of this.store) {
			for (const [eventName, data] of socketStore) {
				if (data.resetTime <= now) {
					socketStore.delete(eventName)
				}
			}
			if (socketStore.size === 0) {
				this.store.delete(socketId)
			}
		}
	}

	/**
	 * Start periodic cleanup of expired throttle data
	 * @param {number} interval Cleanup interval in milliseconds (default: 60000)
	 * @returns {number} The interval timer
	 */
	public static startPeriodicCleanup (interval: number = 60000): NodeJS.Timeout {
		return setInterval(() => this.cleanup(), interval)
	}
}
