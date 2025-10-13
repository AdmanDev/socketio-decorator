import { RoomEventListenerMetadata } from "../MetadataObjects/RoomEventListenerMetadata"

/**
 * Store for managing room event listener metadata
 */
export class RoomEventListenerMetadataStore {
	private static listeners: RoomEventListenerMetadata[] = []

	/**
	 * Adds an room event listener metadata
	 * @param {RoomEventListenerMetadata} metadata The room event listener metadata to add
	 */
	public static add (metadata: RoomEventListenerMetadata): void {
		RoomEventListenerMetadataStore.listeners.push(metadata)
	}

	/**
	 * Gets all room event listener metadata
	 * @returns {RoomEventListenerMetadata[]} All room event listener metadata
	 */
	public static getAll (): RoomEventListenerMetadata[] {
		return RoomEventListenerMetadataStore.listeners
	}
}
