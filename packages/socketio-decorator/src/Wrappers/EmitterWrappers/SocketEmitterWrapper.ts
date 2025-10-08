import { SiodInvalidArgumentError } from "../../Models/Errors/SiodInvalidArgumentError"
import { EventFuncProxyType } from "../../Models/EventFuncProxyType"
import { EmitterMetadata } from "../../MetadataRepository/MetadataObjects/EmitterMetadata"
import { MetadataUtils } from "../../Utils/MetadataUtils"
import { EmitterWrapperUtils } from "./EmitterWrapperUtils"
import { ControllerWrapper } from "../WrapperCore/ControllerWrapper"
import { ControllerMetadata } from "../../MetadataRepository/MetadataObjects/Metadata"
import { ControllerInstance } from "../../Models/Utilities/ControllerTypes"

/**
 * A wrapper to add socket emitter layer to the controller methods
 */
export class SocketEmitterWrapper extends ControllerWrapper {
	/** @inheritdoc */
	public execute (metadata: ControllerMetadata): void {
		const controllerInstance = metadata.controllerInstance!
		const emitters = metadata.methodMetadata.flatMap(m => m.metadata.ioMetadata.emitterMetadata)

		MetadataUtils.mapIoMappingMetadata(emitters, "socket", controllerInstance, (m, method) => {
			this.wrapMethod(m, controllerInstance, method)
		})
	}

	/**
	 * Wraps the method to add server emitter layer
	 * @param {EmitterMetadata} metadata - The emitter metadata of method to wrap
	 * @param {ControllerInstance} controllerInstance - The controller instance
	 * @param {Function} method - The original method of the controller
	 */
	private wrapMethod (metadata: EmitterMetadata, controllerInstance: ControllerInstance, method: Function) {
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