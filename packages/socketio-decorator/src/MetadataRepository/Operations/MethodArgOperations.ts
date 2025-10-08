import { MethodArgMetadata } from "../MetadataObjects/MethodArgMetadata"
import { MethodMetadataStore } from "../Stores/MethodMetadataStore"

/**
 * Operations for managing method argument metadata
 */
export class MethodArgOperations {
	/**
	 * Adds argument metadata to a method
	 * @param {object} target The target object
	 * @param {string} methodName The name of the method
	 * @param {MethodArgMetadata} argMetadata The argument metadata to add
	 */
	public static add (target: Object, methodName: string, argMetadata: MethodArgMetadata): void {
		const methodMetadata = MethodMetadataStore.getOrCreate(target, methodName)
		methodMetadata.argsMetadata.push(argMetadata)
	}
}
