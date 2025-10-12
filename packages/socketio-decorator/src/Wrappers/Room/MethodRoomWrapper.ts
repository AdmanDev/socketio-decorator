import { Socket } from "socket.io"
import { ControllerMetadata, MethodMetadata } from "../../MetadataRepository/MetadataObjects/Metadata"
import { MethodRoomMetadata } from "../../MetadataRepository/MetadataObjects/RoomMetadata"
import { EventFuncProxyType } from "../../Models/EventFuncProxyType"
import { ControllerInstance } from "../../Models/Utilities/ControllerTypes"
import { ControllerWrapper } from "../WrapperCore/ControllerWrapper/ControllerWrapper"

/**
 * Defines a wrapper to apply room decorators to handlers
 */
export class MethodRoomWrapper extends ControllerWrapper {
	/** @inheritdoc */
	public execute (metadata: ControllerMetadata): void {
		const methodsMetadata = metadata
			.methodMetadata
			.filter(m => m.metadata.ioMetadata.listenerMetadata.length > 0 && m.metadata.roomMetadata.length > 0)

		methodsMetadata.forEach(methodsMetadata => {
			this.wrapMethod(methodsMetadata, metadata.controllerInstance!)
		})
	}

	/**
	 * Wraps the method with room actions
	 * @param {MethodMetadata} methodMetadata The method metadata
	 * @param {ControllerInstance} controllerInstance The controller instance
	 */
	private wrapMethod (methodMetadata: MethodMetadata, controllerInstance: ControllerInstance) {
		const methodRoomMetadata = methodMetadata.metadata.roomMetadata

		const methodName = methodMetadata.methodName
		const originalMethod = controllerInstance[methodName] as EventFuncProxyType

		const roomProxy: EventFuncProxyType = async function (proxyArgs) {
			const { socket, data } = proxyArgs

			if (!socket) {
				return await originalMethod.apply(controllerInstance, [proxyArgs])
			}

			await MethodRoomWrapper.executeActions("before", methodRoomMetadata, socket, data)

			const result = await originalMethod.apply(controllerInstance, [proxyArgs])

			await MethodRoomWrapper.executeActions("after", methodRoomMetadata, socket, data?.at(0))

			return result
		}

		controllerInstance[methodName] = roomProxy
	}

	/**
	 * Executes the actions before or after the method is called
	 * @param { "before" | "after"} type The type of action to execute
	 * @param {MethodRoomMetadata[]} metadata The metadata of the actions
	 * @param {Socket} socket The socket
	 * @param {any} data The data
	 */
	private static async executeActions (type: "before" | "after", metadata: MethodRoomMetadata[], socket: Socket, data: Any) {
		await Promise.all(metadata.map(meta => {
			const roomName = meta.roomNameGetter({
				socket,
				data
			})

			const action = type === "before" ? meta.beforeAction : meta.afterAction
			action?.(roomName, socket)
		}))
	}
}