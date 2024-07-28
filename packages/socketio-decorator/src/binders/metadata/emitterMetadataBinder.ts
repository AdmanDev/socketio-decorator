import { Socket } from "socket.io"
import { getEmitterMetadata } from "../../globalMetadata"
import { EmitterMetadata } from "../../types/metadata/emiterMetadata"
import { ControllerMetadata } from "../../types/metadata/listenerMetadata"
import { SiodConfig } from "../../types/SiodConfig"
import { getControllerMetadata, mapMetadata } from "./metadataUtils"
import { EmitterOption } from "../../types/exportables/emitterOption"
import { Metadata } from "../../types/metadata/metadata"

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
		// eslint-disable-next-line jsdoc/require-jsdoc
		controllerInstance[metadata.methodName] = async function (...args: unknown[]) {
			const result = await method.apply(controllerInstance, args)

			const { data, to, message, disableEmit } = getEmitterOption(metadata, result)

			if (disableEmit || !to || !message || !data) {
				return result
			}

			config.ioserver.to(to).emit(message, data)
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
		// eslint-disable-next-line jsdoc/require-jsdoc
		controllerInstance[metadata.methodName] = async function (...args: unknown[]) {
			const result = await method.apply(controllerInstance, args)

			const { data, message, disableEmit } = getEmitterOption(metadata, result)

			if (disableEmit || !message || !data) {
				return result
			}

			const socket = args[0]
			if (socket instanceof Socket) {
				socket.emit(message, data)
			}

			return result
		}
	})
}

/**
 * Gets the emitter option
 * @param {Metadata} metadata The emitter metadata
 * @param {unknown} methodResult The method result
 * @returns {EmitterOption} The emitter option
 */
function getEmitterOption (metadata: Metadata, methodResult: unknown) {
	const { to, message } = metadata as EmitterMetadata

	let finalTo = to
	let finalMessage = message
	let finalData = methodResult
	let finalDisableEmit = false

	if (methodResult instanceof EmitterOption) {
		const { disableEmit, to: newTo, message: newMessage, data } = methodResult

		if (disableEmit) {
			finalDisableEmit = disableEmit
		}

		if (newTo) {
			finalTo = newTo
		}

		if (newMessage) {
			finalMessage = newMessage
		}

		if (data) {
			finalData = data
		}
	}

	return new EmitterOption({
		to: finalTo,
		message: finalMessage,
		data: finalData,
		disableEmit: finalDisableEmit
	})
}