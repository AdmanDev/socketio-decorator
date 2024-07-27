import { getEmitterMetadata } from "../../globalMetadata"
import { EmitterMetadata } from "../../types/metadata/emiterMetadata"
import { ControllerMetadata } from "../../types/metadata/listenerMetadata"
import { SiodConfig } from "../../types/SiodConfig"
import { getControllerMetadata, mapMetadata } from "./metadataUtils"

/**
 * Binds emitter metadata from decorators
 * @param {SiodConfig} config The socketio decocator configuration
 */
export function bindEmitterMetadata (config: SiodConfig) {
	const metadatas = getEmitterMetadata()

	const controllerMetadatas = getControllerMetadata(config, metadatas)
	bindServerEmitters(controllerMetadatas, config)

}

/**
 * Binds server emitters
 * @param {ControllerMetadata[]} controllerMetadata The controllers metadata
 * @param {SiodConfig} config The socketio decocator configuration
 */
function bindServerEmitters (controllerMetadata: ControllerMetadata[], config: SiodConfig) {
	mapMetadata(controllerMetadata, "server", (metadata, controllerInstance, method) => {
		const { methodName, to, message} = metadata as EmitterMetadata

		// eslint-disable-next-line jsdoc/require-jsdoc
		controllerInstance[methodName] = function (...args: unknown[]) {
			const result = method.apply(controllerInstance, args)
			config.ioserver.to(to).emit(message, result)
			return result
		}
	})
}