import { EmitterMetadata } from "../MetadataObjects/EmitterMetadata"
import { MethodMetadataStore } from "../Stores/MethodMetadataStore"

/**
 * Operations for managing emitter metadata
 */
export class EmitterOperations {
	/**
	 * Adds emitter metadata to the method
	 * @param {EmitterMetadata} metadata The metadata to add
	 */
	public static add (metadata: EmitterMetadata): void {
		const methodMetadata = MethodMetadataStore.getOrCreate(metadata.target, metadata.methodName)
		methodMetadata.metadata.ioMetadata.emitterMetadata.push(metadata)
	}
}
