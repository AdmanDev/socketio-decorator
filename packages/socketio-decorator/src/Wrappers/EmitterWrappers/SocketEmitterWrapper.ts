import { SiodInvalidArgumentError } from "../../Models/Errors/SiodInvalidArgumentError"
import { EventFuncProxyType } from "../../Models/EventFuncProxyType"
import { EmitterMetadata } from "../../Models/Metadata/EmiterMetadata"
import { MetadataUtils } from "../../Utils/MetadataUtils"
import { EmitterWrapperUtils } from "./EmitterWrapperUtils"

/**
 * Allow to wrap a method to add socket emitter layer
 */
export class SocketEmitterWrapper {
	/**
	 * Wraps all emitters to add emitter logic
	 * @param {EmitterMetadata[]} metadata - The metadata of the emitters to wrap
	 * @param {any} controllerInstance - The controller instance
	 */
	public static wrapEmitters (metadata: EmitterMetadata[], controllerInstance: Any) {
		MetadataUtils.mapIoMappingMetadata(metadata, "socket", controllerInstance, (m, method) => {
			SocketEmitterWrapper.wrapMethod(m, controllerInstance, method)
		})
	}

	/**
	 * Wraps the method to add server emitter layer
	 * @param {EmitterMetadata} metadata - The emitter metadata of method to wrap
	 * @param {any} controllerInstance - The controller instance
	 * @param {Function} method - The original method of the controller
	 */
	private static wrapMethod (metadata: EmitterMetadata, controllerInstance: Any, method: Function) {
		const wrappedMethod: EventFuncProxyType = async function (proxyArgs) {
			const result = await method.apply(controllerInstance, [proxyArgs])

			const socket = proxyArgs.socket
			if (!socket) {
				throw new SiodInvalidArgumentError("Socket not found to emit data")
			}

			const emitterOptions = EmitterWrapperUtils.getEmitterOptions(metadata, result)

			emitterOptions.forEach((option) => {
				const { data, message, to } = option

				if (EmitterWrapperUtils.canEmit(option)) {
					if (to) {
						socket.to(to).emit(message, data)
					} else {
						socket.emit(message, data)
					}
				}
			})

			return result
		}

		controllerInstance[metadata.methodName] = wrappedMethod
	}
}