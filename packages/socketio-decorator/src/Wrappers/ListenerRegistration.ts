import { IoActionHandler } from "../EventRegistrars/IoActionHandler"
import { config, getControllerMetadata, addEventBinder } from "../globalMetadata"
import { ClassConstructorType } from "../Models/ClassConstructorType"
import { EventFuncProxyType } from "../Models/EventFuncProxyType"
import { ListenerMetadata } from "../Models/Metadata/ListenerMetadata"
import { ControllerMetadata, MethodMetadata } from "../Models/Metadata/Metadata"
import { MetadataUtils } from "../Utils/MetadataUtils"
import { Wrapper } from "./WrapperCore/Wrapper"

/**
 * Defines a wrapper to register listeners
 */
export class ListenerRegistration extends Wrapper {
	/** @inheritdoc */
	public execute (controllerMetadata: ControllerMetadata) {
		const { controllerInstance, methodMetadata } = controllerMetadata

		methodMetadata.forEach(mm => {
			const listenerMetadata = mm.metadata.ioMetadata.listenerMetadata
			this.registerServerListeners(mm, listenerMetadata, controllerInstance)
			this.setupSocketListeners(mm, listenerMetadata, controllerInstance)
		})
	}

	/**
	 * Registers server listeners
	 * @param {MethodMetadata} methodMetadata Metadata of the method
	 * @param {ListenerMetadata[]} listenerMetadata Metadata of the listeners
	 * @param {ClassConstructorType<unknown>} controllerInstance Instance of the controller
	 */
	private registerServerListeners (
		methodMetadata: MethodMetadata,
		listenerMetadata: ListenerMetadata[],
		controllerInstance: ClassConstructorType<unknown>
	) {
		MetadataUtils.mapIoMappingMetadata(listenerMetadata, "server", controllerInstance, (metadata, method) => {
			IoActionHandler.callServerAction(config.ioserver, methodMetadata, metadata, controllerInstance, method)
		})
	}

	/**
	 * Setups socket listeners
	 * @param {MethodMetadata} methodMetadata Metadata of the method
	 * @param {ListenerMetadata[]} listenerMetadata Metadata of the listeners
	 * @param {ClassConstructorType<unknown>} controllerInstance Instance of the controller
	 */
	private setupSocketListeners (
		methodMetadata: MethodMetadata,
		listenerMetadata: ListenerMetadata[],
		controllerInstance: ClassConstructorType<unknown>
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

		const controllerMetadata = getControllerMetadata(controllerInstance)
		const namespace = controllerMetadata?.namespace || "/"

		addEventBinder(namespace, "connection", (socket) => {
			filteredMetadata.forEach(({method, metadata}) => {
				IoActionHandler.callSocketAction(socket, methodMetadata, metadata, controllerInstance, method)
			})
		})
	}
}