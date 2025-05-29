import { Socket } from "socket.io"
import { EventBinder } from "./Models/EventBinder"
import { EmitterMetadata } from "./Models/Metadata/EmiterMetadata"
import { ListenerMetadata } from "./Models/Metadata/ListenerMetadata"
import { TreeMethodMetadata, TreeRootMetadata } from "./Models/Metadata/Metadata"
import { SiodConfig } from "./Models/SiodConfig"
import { MetadataUtils } from "./Utils/MetadataUtils"
import { SocketMiddlewareMetadata } from "./Models/Metadata/MiddlewareMetadata"

const treeMetadata: TreeRootMetadata[] = []
const binderEvents: EventBinder[] = []
export let config: SiodConfig

/**
 * Gets or creates the tree metadata for a given target.
 * @param {object} target - The target object.
 * @returns {TreeRootMetadata} The tree metadata for the target.
 */
function getOrCreateTreeMetadata (target: Object) {
	const metadata = treeMetadata.find((m) => m.controllerTarget === target)
	if (!metadata) {
		const controllerName = MetadataUtils.getTargetName(target)
		const targetClass = MetadataUtils.getTargetClass(target)

		const newMetadata: TreeRootMetadata = {
			controllerTarget: targetClass,
			controllerName,
			methodMetadata: []
		}

		treeMetadata.push(newMetadata)

		return newMetadata
	}
	return metadata
}

/**
 * Gets or creates the tree method metadata for a given target and method name.
 * @param {object} target - The target object.
 * @param {string} methodName - The name of the method.
 * @returns {TreeMethodMetadata} The tree method metadata for the target and method name.
 */
function getOrCreateTreeMethodMetadata (target: Object, methodName: string) {
	const treeMetadata = getOrCreateTreeMetadata(target)
	const methodMetadata = treeMetadata.methodMetadata.find((m) => m.methodName === methodName)
	if (!methodMetadata) {
		const newMethodMetadata: TreeMethodMetadata = {
			methodName,
			metadata: {
				ioMetadata: {
					listenerMetadata: [],
					emitterMetadata: [],
					socketMiddlewareMetadata: []
				}
			}
		}
		treeMetadata.methodMetadata.push(newMethodMetadata)
		return newMethodMetadata
	}
	return methodMetadata
}

/**
 * Gets all the metadata
 * @returns {TreeRootMetadata[]} The global metadata
 */
export function getAllMetadata () {
	return [...treeMetadata] as TreeRootMetadata[]
}

/**
 * Adds listener metadata to the global metadata 
 * @param {ListenerMetadata} metadata The metadata to add
 */
export function addListenerMetadata (metadata: ListenerMetadata) {
	if (["disconnecting", "disconnect"].includes(metadata.eventName)) {
		metadata.dataCheck = false
	}

	const treeMethodMetadata = getOrCreateTreeMethodMetadata(metadata.target, metadata.methodName)
	treeMethodMetadata.metadata.ioMetadata.listenerMetadata.push(metadata)
}

/**
 * Adds emitter metadata to the method tree metadata
 * @param {EmitterMetadata} metadata The metadata to add
 */
export function addEmitterMetadata (metadata: EmitterMetadata) {
	const treeMethodMetadata = getOrCreateTreeMethodMetadata(metadata.target, metadata.methodName)
	treeMethodMetadata.metadata.ioMetadata.emitterMetadata.push(metadata)
}

/**
 * Adds socket middleware metadata to the method tree metadata
 * @param {SocketMiddlewareMetadata} metadata The metadata to add
 */
export function addSocketMiddlewareMetadata (metadata: SocketMiddlewareMetadata) {
	const treeMethodMetadata = getOrCreateTreeMethodMetadata(metadata.target, metadata.methodName)
	treeMethodMetadata.metadata.ioMetadata.socketMiddlewareMetadata.push(metadata)
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