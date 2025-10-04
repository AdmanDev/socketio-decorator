import { config } from "../../globalMetadata"
import { EventFuncProxyType } from "../../Models/EventFuncProxyType"
import { EmitterMetadata } from "../../Models/Metadata/EmiterMetadata"
import { ControllerMetadata } from "../../Models/Metadata/Metadata"
import { MetadataUtils } from "../../Utils/MetadataUtils"
import { Wrapper } from "../WrapperCore/Wrapper"
import { EmitterWrapperUtils } from "./EmitterWrapperUtils"

/**
 * A wrapper to add server emitter layer to the controller methods
 */
export class ServerEmitterWrapper extends Wrapper {
	/** @inheritdoc */
	public execute (metadata: ControllerMetadata): void {
		const controllerInstance = metadata.controllerInstance
		const emitters = metadata.methodMetadata.flatMap(m => m.metadata.ioMetadata.emitterMetadata)

		MetadataUtils.mapIoMappingMetadata(emitters, "server", controllerInstance, (m, method) => {
			this.wrapMethod(m, controllerInstance, method)
		})
	}

	/**
	 * Wraps the method to add server emitter layer
	 * @param {EmitterMetadata} metadata - The emitter metadata of method to wrap
	 * @param {any} controllerInstance - The controller instance
	 * @param {Function} method - The original method of the controller
	 */
	private wrapMethod (metadata: EmitterMetadata, controllerInstance: Any, method: Function) {
		const wrappedMethod: EventFuncProxyType = async function (proxyArgs) {
			const result = await method.apply(controllerInstance, [proxyArgs])

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

		controllerInstance[metadata.methodName] = wrappedMethod
	}

}