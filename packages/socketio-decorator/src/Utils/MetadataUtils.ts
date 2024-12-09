import { IoCContainer } from "../IoCContainer"
import { SiodConfig } from "../Models/SiodConfig"
import { ControllerMetadata } from "../Models/Metadata/ListenerMetadata"
import { Metadata, MetadataType } from "../Models/Metadata/Metadata"

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
	public static getControllerMetadata (config: SiodConfig, metadatas: Metadata[]) {
		const controllerInstances = IoCContainer.getInstances<{constructor: Function}>(config.controllers, config.iocContainer)

		const controllerMetadatas: ControllerMetadata[] = []

		for (const controller of controllerInstances) {
			const filteredMetadata = metadatas.filter((m) => m.target.constructor === controller.constructor)
			controllerMetadatas.push({
				controllerInstance: controller,
				metadatas: filteredMetadata
			})
		}

		return controllerMetadatas
	}

	/**
	 * Maps metadata to the given type
	 * @param {ControllerMetadata} metadata Controller metadata
	 * @param {MetadataType} type The type of metadata to map
	 * @param {Function} callback The callback to call for each metadata
	 */
	public static mapMetadata (
		metadata: ControllerMetadata[],
		type: MetadataType,
		callback: (metadata: Metadata, controllerInstance: Any, method: Any) => void
	) {
		metadata.forEach(controllerMetadatas => {
			const filteredMetadatas = controllerMetadatas.metadatas.filter((m) => m.type === type)

			filteredMetadatas.forEach(metadata => {
				const method = controllerMetadatas.controllerInstance[metadata.methodName]
				if (typeof method === "function") {
					callback(metadata, controllerMetadatas.controllerInstance, method)
				}
			})
		})
	}

}