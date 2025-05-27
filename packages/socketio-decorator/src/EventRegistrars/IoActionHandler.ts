/* eslint-disable max-len */
import { Server, Socket } from "socket.io"
import { Metadata } from "../Models/Metadata/Metadata"
import { MetadataAction } from "../Models/Metadata/Metadata"
import { ListenerMetadata } from "../Models/Metadata/ListenerMetadata"

type ServerAction = {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	[action in MetadataAction]: (ioserver: Server, metadata: Metadata, controllerInstance: Any, method: Function) => void
}

type SocketAction = {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	[action in MetadataAction]: (socket: Socket, metadata: Metadata, controllerInstance: Any, method: Function) => void
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
			on: (ioserver: Server, metadata: Metadata, controller: Any, method: Function) => {
				const { eventName } = metadata as ListenerMetadata
				ioserver.on(eventName, method.bind(controller))
			},
		},
		socket: {
			on: (socket: Socket, metadata: Metadata, controller: Any, method: Function) => {
				const { eventName } = metadata as ListenerMetadata
				socket.on(eventName, method.bind(controller, socket))
			},
			once: (socket: Socket, metadata: Metadata, controller: Any, method: Function) => {
				const { eventName } = metadata as ListenerMetadata
				socket.once(eventName, method.bind(controller, socket))
			},
			onAny: (socket: Socket, metadata: Metadata, controller: Any, method: Function) => {
				socket.onAny(method.bind(controller, socket))
			},
			onAnyOutgoing: (socket: Socket, metadata: Metadata, controller: Any, method: Function) => {
				socket.onAnyOutgoing(method.bind(controller, socket))
			},
		}
	}

	/**
	 * Call the appropriate io server action function
	 * @param {Server} ioserver The socket.io server instance
	 * @param {Metadata} metadata The metadata for the action
	 * @param {any} controller The controller instance
	 * @param {Function} method The method to call
	 */
	public static callServerAction (ioserver: Server, metadata: Metadata, controller: Any, method: Function) {
		const fn = IoActionHandler.ioFns.server[metadata.action]
		IoActionHandler.validateAction(metadata.action, fn)

		fn?.(ioserver, metadata, controller, method)
	}

	/**
	 * Call the appropriate io socket action function
	 * @param {Socket} socket The socket.io socket instance
	 * @param {Metadata} metadata The metadata for the action
	 * @param {any} controller The controller instance
	 * @param {Function} method The method to call
	 */
	public static callSocketAction (socket: Socket, metadata: Metadata, controller: Any, method: Function) {
		const fn = IoActionHandler.ioFns.socket[metadata.action]
		IoActionHandler.validateAction(metadata.action, fn)

		fn?.(socket, metadata, controller, method)
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