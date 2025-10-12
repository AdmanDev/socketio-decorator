import { MethodRoomMetadata } from "../MetadataObjects/RoomMetadata"
import { MethodMetadataStore } from "../Stores/MethodMetadataStore"

/**
 * Operations for managing room metadata for method handlers
 */
export class MethodRoomOperations {
	/**
	 * Adds room metadata to the method
	 * @param {MethodRoomMetadata} metadata The metadata to add
	 */
	public static add (metadata: MethodRoomMetadata): void {
		const { target, methodName } = metadata
		const methodMetadata = MethodMetadataStore.getOrCreate(target, methodName)
		methodMetadata.metadata.roomMetadata.push(metadata)
	}
}