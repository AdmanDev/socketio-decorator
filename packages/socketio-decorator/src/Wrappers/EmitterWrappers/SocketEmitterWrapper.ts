import { Socket } from "socket.io"
import { config, getEmitterMetadata } from "../../globalMetadata"
import { Metadata } from "../../Models/Metadata/Metadata"
import { EmitterWrapperUtils } from "./EmitterWrapperUtils"
import { MetadataUtils } from "../../Utils/MetadataUtils"

/**
 * Allow to wrap a method to add socket emitter layer
 */
export class SocketEmitterWrapper {
	/**
	 * Wraps all emitters controllers to add emitter logic
	 */
	public static wrapAllEmitters () {
		const metadatas = getEmitterMetadata()

		const controllerMetadatas = MetadataUtils.getControllerMetadata(config, metadatas)
		MetadataUtils.mapMetadata(controllerMetadatas, "socket", SocketEmitterWrapper.wrapMethod)
	}

	/**
	 * Wraps the method to add server emitter layer 
	 * @param {Metadata} metadata - The listener metadata of method to wrap
	 * @param {any} controllerInstance - The controller instance
	 * @param {Function} method - The original method of the controller
	 */
	private static wrapMethod (metadata: Metadata, controllerInstance: Any, method: Function) {
		// eslint-disable-next-line jsdoc/require-jsdoc
		controllerInstance[metadata.methodName] = async function (...args: unknown[]) {
			const result = await method.apply(controllerInstance, args)

			const socket = args[0]
			if (socket?.constructor.name === "Socket") {
				const emitterOptions = EmitterWrapperUtils.getEmitterOptions(metadata, result)

				emitterOptions.forEach((option) => {
					const { data, message } = option

					if (EmitterWrapperUtils.canEmit(option)) {
						(socket as Socket).emit(message, data)
					}
				})
			}

			return result
		}
	}
}