import { getInstances } from "../../container"
import { SiodConfig } from "../../types/SiodConfig"
import { ControllerMetadata } from "../../types/metadata/listenerMetadata"
import { Metadata, MetadataType } from "../../types/metadata/metadata"

/**
 * Gets the controller metadata
 * @param {SiodConfig} config The socketio decocator configuration
 * @param {Metadata[]} metadatas The metadata array
 * @returns {ControllerMetadata[]} The controller metadata
 */
export function getControllerMetadata (config: SiodConfig, metadatas: Metadata[]) {
	const controllerInstances = getInstances<{constructor: Function}>(config.controllers, config.iocContainer)

	const controllerMetadatas: ControllerMetadata[] = []

	for (const controller of controllerInstances) {
		const filteredMetadata = metadatas.filter((m) => m.target === controller.constructor)
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
export function mapMetadata (
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