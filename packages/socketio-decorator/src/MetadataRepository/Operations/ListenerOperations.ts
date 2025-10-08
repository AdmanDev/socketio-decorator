import { ListenerMetadata } from "../MetadataObjects/ListenerMetadata"
import { MethodMetadataStore } from "../Stores/MethodMetadataStore"

/**
 * Operations for managing listener metadata
 */
export class ListenerOperations {
	/**
	 * Adds listener metadata to the method
	 * @param {ListenerMetadata} metadata The metadata to add
	 */
	public static add (metadata: ListenerMetadata): void {
		if (["disconnecting", "disconnect"].includes(metadata.eventName)) {
			metadata.dataCheck = false
		}

		const methodMetadata = MethodMetadataStore.getOrCreate(metadata.target, metadata.methodName)
		methodMetadata.metadata.ioMetadata.listenerMetadata.push(metadata)
	}
}
