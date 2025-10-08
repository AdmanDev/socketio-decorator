import { ThrottleMetadata, ClassThrottleMetadata } from "../MetadataObjects/ThrottleMetadata"
import { MethodMetadataStore } from "../Stores/MethodMetadataStore"
import { ControllerMetadataStore } from "../Stores/ControllerMetadataStore"

/**
 * Operations for managing throttle metadata
 */
export class ThrottleOperations {
	/**
	 * Adds method throttle metadata to a method
	 * @param {ThrottleMetadata} metadata The metadata to add
	 */
	public static addToMethod (metadata: ThrottleMetadata): void {
		const methodMetadata = MethodMetadataStore.getOrCreate(metadata.target, metadata.methodName)
		methodMetadata.metadata.throttleMetadata = metadata
	}

	/**
	 * Adds class throttle metadata to a controller
	 * @param {ClassThrottleMetadata} metadata The metadata to add
	 */
	public static addToClass (metadata: ClassThrottleMetadata): void {
		const controllerMetadata = ControllerMetadataStore.getOrCreate(metadata.target)
		controllerMetadata.throttleMetadata = metadata
	}
}
