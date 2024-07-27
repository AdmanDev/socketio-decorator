/* eslint-disable max-len */
import { Server, Socket } from "socket.io"
import { Metadata } from "../types/metadata/metadata"
import { MetadataAction } from "../types/metadata/metadata"
import { ListenerMetadata } from "../types/metadata/listenerMetadata"

type ServerAction = {
	[action in MetadataAction]: (ioserver: Server, metadata: Metadata, controllerInstance: Any, method: Function) => void
}

type SocketAction = {
	[action in MetadataAction]: (socket: Socket, metadata: Metadata, controllerInstance: Any, method: Function) => void
}

type IoActionFnBinder = {
	server: Partial<ServerAction>,
	socket: Partial<SocketAction>
}

const ioFns: IoActionFnBinder = {
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
export function callServerAction (ioserver: Server, metadata: Metadata, controller: Any, method: Function) {
	const fn = ioFns.server[metadata.action]

	if (fn) {
		fn(ioserver, metadata, controller, method)
	} else {
		throw new Error(`Invalid io server action: ${metadata.action}`)
	}
}

/**
 * Call the appropriate io socket action function
 * @param {Socket} socket The socket.io socket instance
 * @param {Metadata} metadata The metadata for the action
 * @param {any} controller The controller instance
 * @param {Function} method The method to call
 */
export function callSocketAction (socket: Socket, metadata: Metadata, controller: Any, method: Function) {
	const fn = ioFns.socket[metadata.action]

	if (fn) {
		fn(socket, metadata, controller, method)
	} else {
		throw new Error(`Invalid io socket action: ${metadata.action}`)
	}
}