import { SocketMiddlewareMetadata, ClassSocketMiddlewareMetadata } from "../MetadataObjects/MiddlewareMetadata"
import { MethodMetadataStore } from "../Stores/MethodMetadataStore"
import { ControllerMetadataStore } from "../Stores/ControllerMetadataStore"

/**
 * Operations for managing middleware metadata
 */
export class MiddlewareOperations {
	/**
	 * Adds socket middleware metadata to the method
	 * @param {SocketMiddlewareMetadata} metadata The metadata to add
	 */
	public static addToMethod (metadata: SocketMiddlewareMetadata): void {
		const methodMetadata = MethodMetadataStore.getOrCreate(metadata.target, metadata.methodName)
		methodMetadata.metadata.socketMiddlewareMetadata.push(metadata)
	}

	/**
	 * Adds class socket middleware metadata to the class methods
	 * @param {ClassSocketMiddlewareMetadata} metadata The metadata to add
	 */
	public static addToClass (metadata: ClassSocketMiddlewareMetadata): void {
		const controllerMetadata = ControllerMetadataStore.getOrCreate(metadata.target)
		controllerMetadata.middlewaresMetadata.push(metadata)
	}
}
