import { ConfigStore } from "../../MetadataRepository/Stores/ConfigStore"
import { IThrottleStorage } from "../../Interfaces/IThrottleStorage"
import { IoCContainer } from "../../IoCContainer"
import { SiodThrottleError } from "../../Models/Errors/SiodThrottleError"
import { InMemoryThrottleStorage } from "./InMemoryThrottleStorage"
import { Socket } from "socket.io"

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
			const config = ConfigStore.get()

			const ThrottleStorageClass = config.throttleConfig?.store || InMemoryThrottleStorage
			this.storeInstance = IoCContainer.getInstance<IThrottleStorage>(ThrottleStorageClass)
		}

		return this.storeInstance
	}

	/**
	 * Check if a request should be throttled
	 * @param {Socket} socket The socket instance
	 * @param {string} eventName The event name
	 * @param {number} limit Maximum requests allowed
	 * @param {number} windowMs Time window in milliseconds
	 * @returns {Promise<void>} Promise that resolves if the request is allowed, rejects with ThrottleError if throttled
	 */
	public static async checkThrottle (
		socket: Socket,
		eventName: string,
		limit: number,
		windowMs: number
	): Promise<void> {
		const clientId = await this.getUserIdentifier(socket)
		const now = Date.now()

		const eventData = await this.store.get(clientId, eventName)

		if (!eventData || eventData.resetTime <= now) {
			await this.store.set(clientId, eventName, {
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
		await this.store.set(clientId, eventName, eventData)
	}

	/**
	 * Start periodic cleanup of expired throttle data
	 * @param {number} interval Cleanup interval in milliseconds (default: 3600000 ms = 1 hour)
	 * @returns {number} The interval timer
	 */
	public static startPeriodicCleanup (interval: number = 3600000): NodeJS.Timeout {
		return setInterval(() => this.store.cleanup(), interval)
	}

	/**
	 * Get user identifier from socket
	 * @param {Socket} socket The socket instance
	 * @returns {Promise<string>} The user identifier
	 */
	private static async getUserIdentifier (socket: Socket): Promise<string> {
		const config = ConfigStore.get()

		if (config.throttleConfig?.getUserIdentifier) {
			return await Promise.resolve(config.throttleConfig.getUserIdentifier(socket))
		}

		return socket.id
	}
}
