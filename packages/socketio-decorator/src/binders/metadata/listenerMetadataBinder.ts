import { addBinderEvent, getListenerMetadata } from "../../globalMetadata"
import { SiodConfig } from "../../types/SiodConfig"
import { ControllerMetadata } from "../../types/metadata/listenerMetadata"
import { callServerAction, callSocketAction } from "../ioActionFnBinders"
import { getControllerMetadata, mapMetadata } from "./metadataUtils"

/**
 * Binds listener metadata from decorators
 * @param {SiodConfig} config The socketio decocator configuration
 */
export function bindListenerMetadata (config: SiodConfig) {
	const metadatas = getListenerMetadata()

	const controllerMetadatas = getControllerMetadata(config, metadatas)

	bindServerListeners(controllerMetadatas, config)
	bindSocketListeners(controllerMetadatas)
}

/**
 * Binds server events
 * @param {ControllerMetadata} controllerMetadata The controller metadata
 * @param {SiodConfig} config The socketio decocator configuration
 */
function bindServerListeners (controllerMetadata: ControllerMetadata[], config: SiodConfig) {
	mapMetadata(controllerMetadata, "server", (metadata, controllerInstance, method) => {
		callServerAction(config.ioserver, metadata, controllerInstance, method)
	})
}

/**
 * Binds socket events to the controller methods
 * @param {ControllerMetadata} controllerMetadata The controller metadata
 */
function bindSocketListeners (controllerMetadata: ControllerMetadata[]) {
	addBinderEvent("connection", (socket) => {
		mapMetadata(controllerMetadata, "socket", (metadata, controllerInstance, method) => {
			callSocketAction(socket, metadata, controllerInstance, method)
		})
	})
}
