import { Socket } from "socket.io"
import { EventBinder } from "./Models/EventBinder"
import { ListenerMetadata } from "./Models/Metadata/ListenerMetadata"
import { EmitterMetadata } from "./Models/Metadata/EmiterMetadata"
import { SiodConfig } from "./Models/SiodConfig"
import { Metadata } from "./Models/Metadata/Metadata"

const ioMetadata = {
	listener: [] as ListenerMetadata[],
	emitters: [] as EmitterMetadata[]
}
const binderEvents: EventBinder[] = []
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
	if (["disconnecting", "disconnect"].includes(metadata.eventName)) {
		metadata.dataCheck = false
	}

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
 * Adds a event binder to the global binder events array
 * @param {string} event The event name
 * @param {Function} bindMethod The method to execute when the event is triggered
 */
export function addEventBinder (event: string, bindMethod: (socket: Socket) => void) {
	binderEvents.push({
		eventName: event,
		method: bindMethod
	})
}

/**
 * Gets the global event binders array
 * @returns {Record<string, Function[]>} The binder events grouped by event name
 */
export function getAllEventBinders () {
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