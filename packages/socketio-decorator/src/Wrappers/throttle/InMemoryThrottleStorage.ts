import { ThrottleEntry, IThrottleStorage } from "../../Interfaces/IThrottleStorage"

/**
 * Default in-memory throttle storage implementation.
 */
export class InMemoryThrottleStorage implements IThrottleStorage {
	private store = new Map<
		string,
		Map<string, ThrottleEntry>
	>()

	/**
	 * Get all throttle data
	 * @returns {Promise<Map<string, Map<string, ThrottleEntry>>>} A promise that resolves to the entire throttle store
	 */
	public async getAll (): Promise<Map<string, Map<string, ThrottleEntry>>> {
		return this.store
	}

	/** @inheritdoc */
	public async get (clientId: string, event: string): Promise<ThrottleEntry | undefined> {
		return this.store.get(clientId)?.get(event)
	}

	/** @inheritdoc */
	public async set (clientId: string, event: string, entry: ThrottleEntry): Promise<void> {
		let socketMap = this.store.get(clientId)
		if (!socketMap) {
			socketMap = new Map()
		}
		socketMap.set(event, entry)
		this.store.set(clientId, socketMap)
	}

	/** @inheritdoc */
	public async cleanup (): Promise<void> {
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
}