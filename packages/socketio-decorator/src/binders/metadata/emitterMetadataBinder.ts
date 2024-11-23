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

			const emitterOptions = getEmitterOptions(metadata, result)

			emitterOptions.forEach((option) => {
				const { data, message, disableEmit, to } = option

				if (disableEmit || !to || !message || !data) {
					return result
				}

				config.ioserver.to(to).emit(message, data)
			})

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

			const socket = args[0]
			if (socket?.constructor.name === "Socket") {
				const emitterOptions = getEmitterOptions(metadata, result)

				emitterOptions.forEach((option) => {
					const { data, message, disableEmit } = option
					if (!disableEmit && message && data) {
						(socket as Socket).emit(message, data)
					}
				})
			}

			return result
		}
	})
}

/**
 * Gets the emitter options
 * @param {Metadata} metadata The emitter metadata
 * @param {unknown} methodResult The method result
 * @returns {EmitterOption[]} The emitter options
 */
function getEmitterOptions (metadata: Metadata, methodResult: unknown) {
	const { to, message } = metadata as EmitterMetadata

	const emitterOptionsCollection: EmitterOption[] = []

	const getNormalizeOption = (option: unknown) => {
		let finalTo = to
		let finalMessage = message
		let finalData = option
		let finalDisableEmit = false

		if (option instanceof EmitterOption) {

			const { disableEmit, to: newTo, message: newMessage, data } = option

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

	if (Array.isArray(methodResult) && methodResult.every(option => option instanceof EmitterOption)) {
		emitterOptionsCollection.push(...methodResult.map(getNormalizeOption))
	} else {
		emitterOptionsCollection.push(getNormalizeOption(methodResult))
	}

	return emitterOptionsCollection
}