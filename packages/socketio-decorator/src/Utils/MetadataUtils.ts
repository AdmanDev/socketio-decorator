import { IoCContainer } from "../IoCContainer"
import { SiodConfig } from "../Models/SiodConfig"
import { ControllerMetadata } from "../Models/Metadata/ListenerMetadata"
import { IoMappingMetadata, Metadata, MetadataType, TreeRootMetadata } from "../Models/Metadata/Metadata"
import { ClassConstructorType } from "../Models/ClassConstructorType"

/**
 * Defines utilities for metadata manipulation
 */
export class MetadataUtils {
	/**
	 * Gets the controller metadata
	 * @param {SiodConfig} config The socketio decocator configuration
	 * @param {Metadata[]} metadatas The metadata array
	 * @returns {ControllerMetadata[]} The controller metadata
	 */
	public static getControllerMetadata (config: SiodConfig, metadatas: TreeRootMetadata[]) {
		const controllerMetadatas: ControllerMetadata[] = []

		for (const metadata of metadatas) {
			const controllerInstance = IoCContainer.getInstance(metadata.controllerTarget) as Any

			controllerMetadatas.push({
				controllerInstance: controllerInstance,
				metadatas: metadata.methodMetadata.flatMap(m => [m.metadata.ioMetadata.listenerMetadata, m.metadata.ioMetadata.emitterMetadata].flat()),
			})
		}

		return controllerMetadatas
	}

	/**
	 * Filters and iterates over IO mapping metadata of a specific type, invoking a callback for each method found.
	 * @param {Metadata[]} metadata - An array of metadata objects to filter and map.
	 * @param {MetadataType} type - The type of metadata to filter for.
	 * @param {any} controllerInstance - The instance of the controller containing the methods.
	 * @param {Function} callback - A callback function that is called with each metadata and its corresponding method.
	 */
	public static mapIoMappingMetadata (
		metadata: IoMappingMetadata[],
		type: MetadataType,
		controllerInstance: Any,
		callback: (metadata: IoMappingMetadata, method: Any) => void
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
	public static mapMetadata <T extends Metadata> (
		metadata: T[],
		controllerInstance: Any,
		callback: (metadata: T, method: Any) => void
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
		return target.constructor as ClassConstructorType<typeof target>
	}

}