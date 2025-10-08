import { IoActionHandler } from "../EventRegistrars/IoActionHandler"
import { ConfigStore } from "../MetadataRepository/Stores/ConfigStore"
import { ControllerMetadataStore } from "../MetadataRepository/Stores/ControllerMetadataStore"
import { EventBinderStore } from "../MetadataRepository/Stores/EventBinderStore"
import { EventFuncProxyType } from "../Models/EventFuncProxyType"
import { ListenerMetadata } from "../MetadataRepository/MetadataObjects/ListenerMetadata"
import { ControllerMetadata, MethodMetadata } from "../MetadataRepository/MetadataObjects/Metadata"
import { MetadataUtils } from "../Utils/MetadataUtils"
import { Wrapper } from "./WrapperCore/Wrapper"
import { ControllerInstance } from "../Models/Utilities/ControllerTypes"

/**
 * Defines a wrapper to register listeners
 */
export class ListenerRegistration extends Wrapper {
	/** @inheritdoc */
	public execute (controllerMetadata: ControllerMetadata) {
		const { controllerInstance, methodMetadata } = controllerMetadata

		methodMetadata.forEach(mm => {
			const listenerMetadata = mm.metadata.ioMetadata.listenerMetadata
			this.registerServerListeners(mm, listenerMetadata, controllerInstance!)
			this.setupSocketListeners(mm, listenerMetadata, controllerInstance!)
		})
	}

	/**
	 * Registers server listeners
	 * @param {MethodMetadata} methodMetadata Metadata of the method
	 * @param {ListenerMetadata[]} listenerMetadata Metadata of the listeners
	 * @param {ControllerInstance} controllerInstance Instance of the controller
	 */
	private registerServerListeners (
		methodMetadata: MethodMetadata,
		listenerMetadata: ListenerMetadata[],
		controllerInstance: ControllerInstance
	) {
		const config = ConfigStore.get()

		MetadataUtils.mapIoMappingMetadata(listenerMetadata, "server", controllerInstance, (metadata, method) => {
			IoActionHandler.callServerAction(config.ioserver, methodMetadata, metadata, controllerInstance, method)
		})
	}

	/**
	 * Setups socket listeners
	 * @param {MethodMetadata} methodMetadata Metadata of the method
	 * @param {ListenerMetadata[]} listenerMetadata Metadata of the listeners
	 * @param {ControllerInstance} controllerInstance Instance of the controller
	 */
	private setupSocketListeners (
		methodMetadata: MethodMetadata,
		listenerMetadata: ListenerMetadata[],
		controllerInstance: ControllerInstance
	) {
		const filteredMetadata: {
			method: EventFuncProxyType,
			metadata: ListenerMetadata
		}[] = []

		MetadataUtils.mapIoMappingMetadata(listenerMetadata, "socket", controllerInstance, (metadata, method) => {
			filteredMetadata.push({
				method,
				metadata
			})
		})

		const controllerMetadata = ControllerMetadataStore.get(controllerInstance)
		const namespace = controllerMetadata?.namespace || "/"

		EventBinderStore.add(namespace, "connection", (socket) => {
			filteredMetadata.forEach(({method, metadata}) => {
				IoActionHandler.callSocketAction(socket, methodMetadata, metadata, controllerInstance, method)
			})
		})
	}
}