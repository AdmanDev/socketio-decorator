import { Socket } from "socket.io"
import { BinderEvent } from "./types/binderEvent"
import { ListenerMetadata } from "./types/metadata/listenerMetadata"
import { EmitterMetadata } from "./types/metadata/emiterMetadata"
import { SiodConfig } from "./types/SiodConfig"
import { Metadata } from "./types/metadata/metadata"

const ioMetadata = {
	listener: [] as ListenerMetadata[],
	emitters: [] as EmitterMetadata[]
}
const binderEvents: BinderEvent[] = []
export let config: SiodConfig

/**
 * Gets all the metadata
 * @returns {Metadata[]} The global metadata
 */
export function getAllMetadata () {
	return [...ioMetadata.listener, ...ioMetadata.emitters] as Metadata[]
}

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
 * Sets the configuration object
 * @param {SiodConfig} configuration The configuration object
 */
export function setConfig (configuration: SiodConfig) {
	config = configuration
}