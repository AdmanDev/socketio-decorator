import { addEventBinder, config, getAllEventBinders } from "../globalMetadata"
import { ListenerMetadata } from "../Models/Metadata/ListenerMetadata"
import { IoMappingMetadata, Metadata } from "../Models/Metadata/Metadata"
import { MetadataUtils } from "../Utils/MetadataUtils"
import { IoActionHandler } from "./IoActionHandler"

/**
 * A class to register listeners controllers
 */
export class ListenersRegistrar {

	/**
	 * Registers server and socket listeners.
	 * @param {ListenerMetadata[]} metadatas - The metadata of the listeners to register
	 * @param {any} controllerInstance - The controller instance
	 */
	public static registerListeners (metadatas: ListenerMetadata[], controllerInstance: Any) {
		ListenersRegistrar.registerServerListeners(metadatas, controllerInstance)
		ListenersRegistrar.setupSocketListeners(metadatas, controllerInstance)
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
	 * @param {Metadata[]} metadata Metadata of the listeners
	 * @param {any} controllerInstance Instance of the controller
	 */
	private static registerServerListeners (metadata: IoMappingMetadata[], controllerInstance: Any) {
		MetadataUtils.mapIoMappingMetadata(metadata, "server", controllerInstance, (metadata, method) => {
			IoActionHandler.callServerAction(config.ioserver, metadata, controllerInstance, method)
		})
	}

	/**
	 * Setups socket listeners
	 * @param {Metadata[]} metadata Metadata of the listeners
	 * @param {any} controllerInstance Instance of the controller
	 */
	private static setupSocketListeners (metadata: IoMappingMetadata[], controllerInstance: Any) {
		const filteredMetadata: {method: Function, metadata: IoMappingMetadata}[] = []

		MetadataUtils.mapIoMappingMetadata(metadata, "socket", controllerInstance, (metadata, method) => {
			filteredMetadata.push({
				method,
				metadata
			})
		})

		addEventBinder("connection", (socket) => {
			filteredMetadata.forEach(({method, metadata}) => {
				IoActionHandler.callSocketAction(socket, metadata, controllerInstance, method)
			})
		})
	}

}