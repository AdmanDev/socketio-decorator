import { Server, Socket } from "socket.io"
import { BinderEvent } from "./types/binderEvent"
import { ListenerMetadata } from "./types/metadata/listenerMetadata"
import { EmitterMetadata } from "./types/metadata/emiterMetadata"

const ioMetadata = {
	listener: [] as ListenerMetadata[],
	emitters: [] as EmitterMetadata[]
}
const binderEvents: BinderEvent[] = []
export let ioServer: Server

/**
 * Adds listener metadata to the global metadata 
 * @param {ListenerMetadata} metadata The metadata to add
 */
export function addListenerMetadata (metadata: ListenerMetadata) {
	ioMetadata.listener.push(metadata)
}

/**
 * Gets the listener metadata array
 * @returns {ListenerMetadata[]} The global metadata array
 */
export function getListenerMetadata () {
	return [...ioMetadata.listener]
}

/**
 * Adds emitter metadata to the global metadata 
 * @param {EmitterMetadata} metadata The metadata to add
 */
export function addEmitterMetadata (metadata: EmitterMetadata) {
	ioMetadata.emitters.push(metadata)
}

/**
 * Gets the emitter metadata array
 * @returns {ListenerMetadata[]} The global metadata array
 */
export function getEmitterMetadata () {
	return [...ioMetadata.emitters]
}

/**
 * Adds a binder event to the global binder events array
 * @param {string} event The event name
 * @param {Function} bindMethod The method to execute when the event is triggered
 */
export function addBinderEvent (event: string, bindMethod: (socket: Socket) => void) {
	binderEvents.push({
		eventName: event,
		method: bindMethod
	})
}

/**
 * Gets the global binder events array
 * @returns {Record<string, Function[]>} The binder events grouped by event name
 */
export function getAllBinderEvents () {
	return binderEvents.reduce((acc, event) => {
		if (!acc[event.eventName]) {
			acc[event.eventName] = []
		}
		acc[event.eventName].push(event.method)
		return acc
	}, {} as Record<string, Function[]>)
}

/**
 * Sets the socket.io server instance
 * @param {Server} server The socket.io server instance
 */
export function setIoServer (server: Server) {
	ioServer = server
}