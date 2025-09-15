import { config } from "../../globalMetadata"
import { IThrottleStorage } from "../../Interfaces/IThrottleStorage"
import { IoCContainer } from "../../IoCContainer"
import { SiodThrottleError } from "../../Models/Errors/SiodThrottleError"
import { InMemoryThrottleStorage } from "./InMemoryThrottleStorage"

/**
 * Manages throttling state and checks for all socket events
 */
export class ThrottleManager {
	private static storeInstance: IThrottleStorage | null = null

	/**
	 * Get the throttle store instance (singleton)
	 * @returns {IThrottleStorage} The throttle store instance
	 */
	private static get store () {
		if (!this.storeInstance) {
			const IoCContainerClass = config.throttleConfig?.store || InMemoryThrottleStorage
			this.storeInstance = IoCContainer.getInstance<IThrottleStorage>(IoCContainerClass)
		}
		return this.storeInstance
	}

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

		const eventData = await this.store.get(socketId, eventName)

		if (!eventData || eventData.resetTime <= now) {
			await this.store.set(socketId, eventName, {
				count: 1,
				resetTime: now + windowMs
			})
			return
		}

		if (eventData.count >= limit) {
			const remainingTime = eventData.resetTime - now
			throw new SiodThrottleError(remainingTime)
		}

		eventData.count++
		await this.store.set(socketId, eventName, eventData)
	}

	/**
	 * Start periodic cleanup of expired throttle data
	 * @param {number} interval Cleanup interval in milliseconds (default: 3600000 ms = 1 hour)
	 * @returns {number} The interval timer
	 */
	public static startPeriodicCleanup (interval: number = 3600000): NodeJS.Timeout {
		return setInterval(() => this.store.cleanup(), interval)
	}
}
