import { AdapterListenerMetadata } from "../MetadataObjects/AdapterListenerMetadata"

export type AdapterListenerEntry = AdapterListenerMetadata & {
	targetClass: Function
	methodName: string
}

/**
 * Store for managing adapter listener metadata independently from controllers
 */
export class AdapterListenerMetadataStore {
	private static listeners: AdapterListenerEntry[] = []

	/**
	 * Adds an adapter listener entry
	 * @param {AdapterListenerEntry} entry The adapter listener entry to add
	 */
	public static add (entry: AdapterListenerEntry): void {
		AdapterListenerMetadataStore.listeners.push(entry)
	}

	/**
	 * Gets all adapter listener entries
	 * @returns {AdapterListenerEntry[]} All adapter listener entries
	 */
	public static getAll (): AdapterListenerEntry[] {
		return AdapterListenerMetadataStore.listeners
	}
}
