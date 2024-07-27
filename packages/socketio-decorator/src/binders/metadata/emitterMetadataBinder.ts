import { Socket } from "socket.io"
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
	bindSocketEmitters(controllerMetadatas)
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

/**
 * Binds socket emitters
 * @param {ControllerMetadata[]} controllerMetadata The controllers metadata
 */
function bindSocketEmitters (controllerMetadata: ControllerMetadata[]) {
	mapMetadata(controllerMetadata, "socket", (metadata, controllerInstance, method) => {
		const { methodName, message} = metadata as EmitterMetadata

		// eslint-disable-next-line jsdoc/require-jsdoc
		controllerInstance[methodName] = function (...args: unknown[]) {
			const result = method.apply(controllerInstance, args)

			const socket = args[0]
			if (socket instanceof Socket) {
				socket.emit(message, result)
			}

			return result
		}
	})
}