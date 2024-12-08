import { IoActionHandler } from "./IoActionHandler"
import { addEventBinder, config, getAllEventBinders, getListenerMetadata } from "../globalMetadata"
import { ControllerMetadata } from "../Models/Metadata/ListenerMetadata"
import { Metadata } from "../Models/Metadata/Metadata"
import { MetadataUtils } from "../Utils/MetadataUtils"

/**
 * A class to register listeners controllers
 */
export class ListenersRegistrar {

	/**
	 * Registers server and socket listeners.
	 */
	public static registerListeners () {
		const metadatas = getListenerMetadata()

		const controllerMetadatas = MetadataUtils.getControllerMetadata(config, metadatas)

		ListenersRegistrar.registerServerListeners(controllerMetadatas)
		ListenersRegistrar.setupSocketListeners(controllerMetadatas)
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
	 * @param {ControllerMetadata[]} controllerMetadata Metadata of controllers
	 */
	private static registerServerListeners (controllerMetadata: ControllerMetadata[]) {
		MetadataUtils.mapMetadata(controllerMetadata, "server", (metadata, controllerInstance, method) => {
			IoActionHandler.callServerAction(config.ioserver, metadata, controllerInstance, method)
		})
	}

	/**
	 * Setups socket listeners
	 * @param {ControllerMetadata[]} controllerMetadata Metadata of controllers
	 */
	private static setupSocketListeners (controllerMetadata: ControllerMetadata[]) {
		const filteredMetadata: {method: Function, controllerInstance: Any, metadata: Metadata}[] = []

		MetadataUtils.mapMetadata(controllerMetadata, "socket", (metadata, controllerInstance, method) => {
			filteredMetadata.push({
				controllerInstance,
				method,
				metadata
			})
		})

		addEventBinder("connection", (socket) => {
			filteredMetadata.forEach(({controllerInstance, method, metadata}) => {
				IoActionHandler.callSocketAction(socket, metadata, controllerInstance, method)
			})
		})
	}

}