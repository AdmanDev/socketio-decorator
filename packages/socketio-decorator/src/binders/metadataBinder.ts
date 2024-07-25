import { getInstances } from "../container"
import { addBinderEvent, getAllMetadata } from "../globalMetadata"
import { SiodConfig } from "../types/SiodConfig"
import { ControllerMetadata, Metadata, MetadataType } from "../types/metadata"
import { callServerAction, callSocketAction } from "./ioActionFnBinders"

/**
 * Use metadata from decorators
 * @param {SiodConfig} config The socketio decocator configuration
 */
export function useMetadata (config: SiodConfig) {
	const metadatas = getAllMetadata()

	const controllerInstances = getInstances<{constructor: Function}>(config.controllers, config.iocContainer)

	const controllerMetadatas: ControllerMetadata[] = []

	for (const controller of controllerInstances) {
		const filteredMetadata = metadatas.filter((m) => m.target === controller.constructor)
		controllerMetadatas.push({
			controllerInstance: controller,
			metadatas: filteredMetadata
		})
	}

	bindServerEvents(controllerMetadatas, config)
	bindSocketEvents(controllerMetadatas)
}

/**
 * Binds server events
 * @param {ControllerMetadata} controllerMetadata The controller metadata
 * @param {SiodConfig} config The socketio decocator configuration
 */
function bindServerEvents (controllerMetadata: ControllerMetadata[], config: SiodConfig) {
	mapMetadata(controllerMetadata, "server", (metadata, controllerInstance, method) => {
		callServerAction(config.ioserver, metadata, controllerInstance, method)
	})
}

/**
 * Binds socket events to the controller methods
 * @param {ControllerMetadata} controllerMetadata The controller metadata
 */
function bindSocketEvents (controllerMetadata: ControllerMetadata[]) {
	addBinderEvent("connection", (socket) => {
		mapMetadata(controllerMetadata, "socket", (metadata, controllerInstance, method) => {
			callSocketAction(socket, metadata, controllerInstance, method)
		})
	})
}

/**
 * Maps metadata to the given type
 * @param {ControllerMetadata} metadata Controller metadata
 * @param {MetadataType} type The type of metadata to map
 * @param {Function} callback The callback to call for each metadata
 */
function mapMetadata (
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
