/* eslint-disable max-len */
import { Server, Socket } from "socket.io"
import { ListenerMetadata } from "../Models/Metadata/ListenerMetadata"
import { MethodMetadata } from "../Models/Metadata/Metadata"
import { EventFuncProxyArgs, EventFuncProxyType } from "../Models/EventFuncProxyType"
import { EventMapAction } from "../Models/Metadata/EventMappingDescription"

type ServerAction = {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	[action in EventMapAction]: (ioserver: Server, eventName: string, metadata: MethodMetadata, controllerInstance: Any, method: EventFuncProxyType) => void
}

type SocketAction = {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	[action in EventMapAction]: (socket: Socket, eventName: string, metadata: MethodMetadata, controller: Any, method: EventFuncProxyType) => void
}

type IoActionFnBinder = {
	server: Partial<ServerAction>,
	socket: Partial<SocketAction>
}

/**
 * Utility class for managing Socket.IO event bindings
 */
export class IoActionHandler {
	private static readonly ioFns: IoActionFnBinder = {
		server: {
			on: (ioserver: Server, eventName: string, metadata: MethodMetadata, controller: Any, method: EventFuncProxyType) => {
				ioserver.on(eventName, (socket: Socket) => {
					const proxyArgs = new EventFuncProxyArgs([socket], [], metadata, eventName, socket)
					method.apply(controller, [proxyArgs])
				})
			},
		},
		socket: {
			on: (socket: Socket, eventName: string, metadata: MethodMetadata, controller: Any, method: EventFuncProxyType) => {
				socket.on(eventName, (...data: unknown[]) => {
					const proxyArgs = new EventFuncProxyArgs([socket, ...data], data, metadata, eventName, socket)
					method.apply(controller, [proxyArgs])
				})
			},
			once: (socket: Socket, eventName: string, metadata: MethodMetadata, controller: Any, method: EventFuncProxyType) => {
				socket.once(eventName, (...data: unknown[]) => {
					const proxyArgs = new EventFuncProxyArgs([socket, ...data], data, metadata, eventName, socket)
					method.apply(controller, [proxyArgs])
				})
			},
			onAny: (socket: Socket, _: string, metadata: MethodMetadata, controller: Any, method: EventFuncProxyType) => {
				socket.onAny((eventName: string, ...data: unknown[]) => {
					const proxyArgs = new EventFuncProxyArgs(
						[socket, eventName, ...data],
						data,
						metadata,
						eventName,
						socket
					)

					method.apply(controller, [proxyArgs])
				})
			},
			onAnyOutgoing: (socket: Socket, _: string, metadata: MethodMetadata, controller: Any, method: EventFuncProxyType) => {
				socket.onAnyOutgoing((eventName: string, ...data: unknown[]) => {
					const proxyArgs = new EventFuncProxyArgs(
						[socket, eventName, ...data],
						data,
						metadata,
						eventName,
						socket
					)

					method.apply(controller, [proxyArgs])
				})
			},
		}
	}

	/**
	 * Call the appropriate io server action function
	 * @param {Server} ioserver The socket.io server instance
	 * @param {MethodMetadata} methodMetadata The method metadata 
	 * @param {ListenerMetadata} listenerMetadata The listener metadata
	 * @param {any} controller The controller instance
	 * @param {Function} method The method to call
	 */
	public static callServerAction (ioserver: Server, methodMetadata: MethodMetadata, listenerMetadata: ListenerMetadata, controller: Any, method: EventFuncProxyType) {
		const fn = IoActionHandler.ioFns.server[listenerMetadata.action]
		IoActionHandler.validateAction(listenerMetadata.action, fn)

		fn?.(ioserver, listenerMetadata.eventName, methodMetadata, controller, method)
	}

	/**
	 * Call the appropriate io socket action function
	 * @param {Socket} socket The socket.io socket instance
	 * @param {MethodMetadata} methodMetadata The metadata for the method
	 * @param {ListenerMetadata} listenerMetadata The listener metadata
	 * @param {any} controller The controller instance
	 * @param {Function} method The method to call
	 */
	public static callSocketAction (socket: Socket, methodMetadata: MethodMetadata, listenerMetadata: ListenerMetadata, controller: Any, method: EventFuncProxyType) {
		const fn = IoActionHandler.ioFns.socket[listenerMetadata.action]
		IoActionHandler.validateAction(listenerMetadata.action, fn)

		fn?.(socket, listenerMetadata.eventName, methodMetadata, controller, method)
	}

	/**
	 * Validate if the given action is a valid io socket action
	 * @param {string} action The action name 
	 * @param {Function} [fn] The action function to validate
	 * @throws {Error} If the action is invalid
	 */
	private static validateAction (action: string, fn?: Function) {
		if (!fn) {
			throw new Error(`Invalid io socket action: ${action}`)
		}
	}

}