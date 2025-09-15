/**
 * Throttle entry representing the count and reset time for a specific client and event.
 */
export interface ThrottleEntry {
	count: number
	resetTime: number
}

/**
 * Interface for a throttle storage to manage throttle entries.
 */
export interface IThrottleStorage {
	/**
	 * Get throttle entry for a specific client and event
	 * @param {string} clientId The ID of the client
	 * @param {string} event The event name
	 * @returns {Promise<ThrottleEntry | undefined>} A promise that resolves to the throttle entry if found, otherwise undefined
	 */
	get(clientId: string, event: string): Promise<ThrottleEntry | undefined>

	/**
	 * Set / update throttle entry for a specific client and event
	 * @param {string} clientId The ID of the client
	 * @param {string} event The event name
	 * @param {ThrottleEntry} entry The throttle entry to set
	 */
	set(clientId: string, event: string, entry: ThrottleEntry): Promise<void>

	/**
	 * Cleanup the throttle store
	 */
	cleanup(): Promise<void>
}
