import { ClassConstructorType } from "../Models/ClassConstructorType"
import { EventFuncProxyType } from "../Models/EventFuncProxyType"
import { EventMappingDescription, EventMappingType } from "../Models/Metadata/EventMappingDescription"
import { MetadataDescription } from "../Models/Metadata/Metadata"

/**
 * Defines utilities for metadata manipulation
 */
export class MetadataUtils {
	/**
	 * Filters and iterates over IO mapping metadata of a specific type, invoking a callback for each method found.
	 * @param {MetadataDescription[]} metadata - An array of metadata objects to filter and map.
	 * @param {EventMappingType} type - The type of metadata to filter for.
	 * @param {any} controllerInstance - The instance of the controller containing the methods.
	 * @param {Function} callback - A callback function that is called with each metadata and its corresponding method.
	 */
	public static mapIoMappingMetadata<TMetadata extends EventMappingDescription> (
		metadata: TMetadata[],
		type: EventMappingType,
		controllerInstance: Any,
		callback: (metadata: TMetadata, method: EventFuncProxyType) => void
	) {
		const filteredMetadata = metadata.filter((m) => m.type === type)
		MetadataUtils.mapMetadata(filteredMetadata, controllerInstance, callback)
	}

	/**
	 * Iterates over an array of metadata objects, invoking a callback for each associated method on the controller instance.
	 * @template T The type of metadata to be processed
	 * @param {T[]} metadata - An array of metadata objects to be processed.
	 * @param {any} controllerInstance - The instance of the controller containing the methods.
	 * @param {Function} callback - A callback function that is called with each metadata and its corresponding method.
	 */
	public static mapMetadata <T extends MetadataDescription> (
		metadata: T[],
		controllerInstance: Any,
		callback: (metadata: T, method: EventFuncProxyType) => void
	) {
		metadata.forEach(m => {
			const method = controllerInstance[m.methodName]
			if (typeof method === "function") {
				callback(m, method)
			}
		})
	}

	/**
	 * Gets the name of the target's constructor.
	 * @param {object} target - The target object.
	 * @returns {string} The name of the target's constructor.
	 */
	public static getTargetName (target: Object) {
		return target.constructor.name
	}

	/**
	 * Gets the class constructor of the target.
	 * @param {object} target - The target object.
	 * @returns {ClassConstructorType<typeof target>} The class constructor of the target.
	 */
	public static getTargetClass (target: Object) {
		if (typeof target === "function") {
			return target as ClassConstructorType<typeof target>
		}

		return target.constructor as ClassConstructorType<typeof target>
	}

}