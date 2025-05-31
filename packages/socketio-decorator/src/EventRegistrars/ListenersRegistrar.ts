import { addEventBinder, config, getAllEventBinders } from "../globalMetadata"
import { EventFuncProxyType } from "../Models/EventFuncProxyType"
import { ListenerMetadata } from "../Models/Metadata/ListenerMetadata"
import { TreeMethodMetadata } from "../Models/Metadata/Metadata"
import { MetadataUtils } from "../Utils/MetadataUtils"
import { IoActionHandler } from "./IoActionHandler"

/**
 * A class to register listeners controllers
 */
export class ListenersRegistrar {

	/**
	 * Registers server and socket listeners.
	 * @param {TreeMethodMetadata[]} metadata - The metadata of the listeners to register
	 * @param {any} controllerInstance - The controller instance
	 */
	public static registerListeners (metadata: TreeMethodMetadata[], controllerInstance: Any) {
		metadata.forEach(methodMetadata => {
			const listenerMetadata = methodMetadata.metadata.ioMetadata.listenerMetadata
			ListenersRegistrar.registerServerListeners(methodMetadata, listenerMetadata, controllerInstance)
			ListenersRegistrar.setupSocketListeners(methodMetadata, listenerMetadata, controllerInstance)
		})
	}

	/**
	 * Applies grouped socket events registration
	 */
	public static applyGroupedSocketEventsRegistration () {
		const binderEvents = getAllEventBinders()
		Object.keys(binderEvents)
			.forEach(event => {
				config.ioserver.on(event, (socket) => {
					binderEvents[event].forEach(method => method(socket))
				})
			})
	}

	/**
	 * Registers server listeners
	 * @param {TreeMethodMetadata} methodMetadata Metadata of the method
	 * @param {ListenerMetadata[]} listenerMetadata Metadata of the listeners
	 * @param {any} controllerInstance Instance of the controller
	 */
	private static registerServerListeners (methodMetadata: TreeMethodMetadata, listenerMetadata: ListenerMetadata[], controllerInstance: Any) {
		MetadataUtils.mapIoMappingMetadata(listenerMetadata, "server", controllerInstance, (metadata, method) => {
			IoActionHandler.callServerAction(config.ioserver, methodMetadata, metadata, controllerInstance, method)
		})
	}

	/**
	 * Setups socket listeners
	 * @param {TreeMethodMetadata} methodMetadata Metadata of the method
	 * @param {ListenerMetadata[]} listenerMetadata Metadata of the listeners
	 * @param {any} controllerInstance Instance of the controller
	 */
	private static setupSocketListeners (methodMetadata: TreeMethodMetadata, listenerMetadata: ListenerMetadata[], controllerInstance: Any) {
		const filteredMetadata: {method: EventFuncProxyType, metadata: ListenerMetadata}[] = []

		MetadataUtils.mapIoMappingMetadata(listenerMetadata, "socket", controllerInstance, (metadata, method) => {
			filteredMetadata.push({
				method,
				metadata
			})
		})

		addEventBinder("connection", (socket) => {
			filteredMetadata.forEach(({method, metadata}) => {
				IoActionHandler.callSocketAction(socket, methodMetadata, metadata, controllerInstance, method)
			})
		})
	}

}