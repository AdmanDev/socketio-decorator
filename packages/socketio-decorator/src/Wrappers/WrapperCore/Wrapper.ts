import { ControllerMetadata } from "../../MetadataRepository/MetadataObjects/Metadata"

/**
 * Defines an abstract wrapper class that all wrappers must extend
 */
export abstract class Wrapper {
	/**
	 * Executes the wrapper
	 * @param {ControllerMetadata} metadata - The controller metadata
	 */
	public abstract execute (metadata: ControllerMetadata): void
}