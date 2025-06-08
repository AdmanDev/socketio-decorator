import { Socket } from "socket.io"
import { EventBinder } from "./Models/EventBinder"
import { EmitterMetadata } from "./Models/Metadata/EmiterMetadata"
import { ListenerMetadata } from "./Models/Metadata/ListenerMetadata"
import { MethodMetadata, ControllerMetadata } from "./Models/Metadata/Metadata"
import { SiodConfig } from "./Models/SiodConfig"
import { MetadataUtils } from "./Utils/MetadataUtils"
import { ClassSocketMiddlewareMetadata, SocketMiddlewareMetadata } from "./Models/Metadata/MiddlewareMetadata"
import { defineReflectMethodMetadata } from "./reflectLetadataFunc"

const controllerMetadata: ControllerMetadata[] = []
const binderEvents: EventBinder[] = []
export let config: SiodConfig

/**
 * Gets or creates the controller metadata for a given target.
 * @param {object} target - The target object.
 * @returns {ControllerMetadata} The controller metadata for the target.
 */
function getOrCreateControllerMetadata (target: Object) {
	const targetClass = MetadataUtils.getTargetClass(target)
	const metadata = controllerMetadata.find((m) => m.controllerTarget === targetClass)

	if (!metadata) {
		const controllerName = MetadataUtils.getTargetName(target)

		const newMetadata: ControllerMetadata = {
			controllerTarget: targetClass,
			controllerName,
			methodMetadata: [],
			middlewaresMetadata: []
		}

		controllerMetadata.push(newMetadata)

		return newMetadata
	}

	return metadata
}

/**
 * Gets or creates the method metadata for a given target and method name.
 * @param {object} target - The target object.
 * @param {string} methodName - The name of the method.
 * @returns {MethodMetadata} The method metadata for the target and method name.
 */
function getOrCreateMethodMetadata (target: Object, methodName: string) {
	const controllerMetadata = getOrCreateControllerMetadata(target)
	const methodMetadata = controllerMetadata.methodMetadata.find((m) => m.methodName === methodName)
	if (!methodMetadata) {
		const newMethodMetadata: MethodMetadata = {
			methodName,
			metadata: {
				ioMetadata: {
					listenerMetadata: [],
					emitterMetadata: [],
				},
				socketMiddlewareMetadata: []
			}
		}

		controllerMetadata.methodMetadata.push(newMethodMetadata)

		defineReflectMethodMetadata(target, newMethodMetadata)

		return newMethodMetadata
	}

	return methodMetadata
}

/**
 * Gets all the metadata
 * @returns {ControllerMetadata[]} The global metadata
 */
export function getAllMetadata () {
	return [...controllerMetadata]
}

/**
 * Adds listener metadata to the method
 * @param {ListenerMetadata} metadata The metadata to add
 */
export function addListenerMetadata (metadata: ListenerMetadata) {
	if (["disconnecting", "disconnect"].includes(metadata.eventName)) {
		metadata.dataCheck = false
	}

	const methodMetadata = getOrCreateMethodMetadata(metadata.target, metadata.methodName)
	methodMetadata.metadata.ioMetadata.listenerMetadata.push(metadata)
}

/**
 * Adds emitter metadata to the method
 * @param {EmitterMetadata} metadata The metadata to add
 */
export function addEmitterMetadata (metadata: EmitterMetadata) {
	const methodMetadata = getOrCreateMethodMetadata(metadata.target, metadata.methodName)
	methodMetadata.metadata.ioMetadata.emitterMetadata.push(metadata)
}

/**
 * Adds socket middleware metadata to the method
 * @param {SocketMiddlewareMetadata} metadata The metadata to add
 */
export function addMethodSocketMiddlewareMetadata (metadata: SocketMiddlewareMetadata) {
	const methodMetadata = getOrCreateMethodMetadata(metadata.target, metadata.methodName)
	methodMetadata.metadata.socketMiddlewareMetadata.push(metadata)
}

/**
 * Adds class socket middleware metadata to the class methods
 * @param {ClassSocketMiddlewareMetadata} metadata The metadata to add
 */
export function addClassSocketMiddlewareMetadata (metadata: ClassSocketMiddlewareMetadata) {
	const controllerMetadata = getOrCreateControllerMetadata(metadata.target)
	controllerMetadata.middlewaresMetadata.push(metadata)
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