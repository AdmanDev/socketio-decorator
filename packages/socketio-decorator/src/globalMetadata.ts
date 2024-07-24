import { Socket } from "socket.io"
import { BinderEvent } from "./types/binderEvent"
import { Metadata } from "./types/metadata"

const ioMetadata: Metadata[] = []
const binderEvents: BinderEvent[] = []

/**
 * Adds metadata to the global metadata array
 * @param {Metadata} metadata The metadata to add
 */
export function addMetadata (metadata: Metadata) {
	ioMetadata.push(metadata)
}

/**
 * Gets the global metadata array
 * @returns {Metadata[]} The global metadata array
 */
export function getAllMetadata () {
	return [...ioMetadata]
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