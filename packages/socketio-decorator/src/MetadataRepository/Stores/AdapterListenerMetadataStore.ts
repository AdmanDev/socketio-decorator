import { AdapterListenerMetadata } from "../MetadataObjects/AdapterListenerMetadata"

/**
 * Store for managing adapter listener metadata independently from controllers
 */
export class AdapterListenerMetadataStore {
	private static listeners: AdapterListenerMetadata[] = []

	/**
	 * Adds an adapter listener metadata
	 * @param {AdapterListenerMetadata} metadata The adapter listener metadata to add
	 */
	public static add (metadata: AdapterListenerMetadata): void {
		AdapterListenerMetadataStore.listeners.push(metadata)
	}

	/**
	 * Gets all adapter listener metadata
	 * @returns {AdapterListenerMetadata[]} All adapter listener metadata
	 */
	public static getAll (): AdapterListenerMetadata[] {
		return AdapterListenerMetadataStore.listeners
	}
}
