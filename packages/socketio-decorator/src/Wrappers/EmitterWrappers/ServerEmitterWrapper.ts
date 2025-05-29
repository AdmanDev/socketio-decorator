import { config } from "../../globalMetadata"
import { EmitterMetadata } from "../../Models/Metadata/EmiterMetadata"
import { Metadata } from "../../Models/Metadata/Metadata"
import { MetadataUtils } from "../../Utils/MetadataUtils"
import { EmitterWrapperUtils } from "./EmitterWrapperUtils"

/**
 * Allow to wrap a method to add server emitter layer
 */
export class ServerEmitterWrapper {
	/**
	 * Wraps all emitters controllers to add emitter logic
	 * @param {EmitterMetadata[]} metadata - The metadata of the emitters to wrap
	 * @param {any} controllerInstance - The controller instance
	 */
	public static wrapEmitters (metadata: EmitterMetadata[], controllerInstance: Any) {
		MetadataUtils.mapIoMappingMetadata(metadata, "server", controllerInstance, (m, method) => {
			ServerEmitterWrapper.wrapMethod(m, controllerInstance, method)
		})
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

			const emitterOptions = EmitterWrapperUtils.getEmitterOptions(metadata, result)

			emitterOptions.forEach((option) => {
				const { data, message, to } = option

				if (!EmitterWrapperUtils.canEmit(option)) {
					return result
				}

				if (to) {
					config.ioserver.to(to).emit(message, data)
				} else {
					config.ioserver.emit(message, data)
				}
			})

			return result
		}
	}

}