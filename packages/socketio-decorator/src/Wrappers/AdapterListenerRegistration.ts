import { Namespace, Server, Socket } from "socket.io"
import {  AdapterListenerMetadataStore } from "../MetadataRepository/Stores/AdapterListenerMetadataStore"
import { ConfigStore } from "../MetadataRepository/Stores/ConfigStore"
import { Operation } from "./WrapperCore/Operation/Operation"
import { SiodInvalidMetadataError } from "../Models/Errors/SiodInvalidMetadataError"
import { IoCContainer } from "../IoCContainer"
import { AdapterListenerMetadata } from "../MetadataRepository/MetadataObjects/AdapterListenerMetadata"

/**
 * Registers adapter listeners independently from controllers
 */
export class AdapterListenerRegistration extends Operation {
	/** @inheritdoc */
	public execute () {
		const ioserver = ConfigStore.get().ioserver
		const listeners = AdapterListenerMetadataStore.getAll()

		listeners.forEach(listenerMetadata => {
			this.registerAdapterListener(ioserver, listenerMetadata)
		})
	}

	/**
	 * Registers a single adapter listener
	 * @param {Server} ioserver The Socket.IO server instance
	 * @param {AdapterListenerMetadata} listenerMetadata The listener metadata to register
	 */
	private registerAdapterListener (ioserver: Server, listenerMetadata: AdapterListenerMetadata) {
		const namespace = ioserver.of(listenerMetadata.namespace)

		const classInstance = IoCContainer.getInstance<InstanceType<Any>>(listenerMetadata.target.constructor)

		const { action } = listenerMetadata

		switch (action) {
			case "create-room":
			case "delete-room":
				this.RegisterAsRoomLifecycleEventListener(action, namespace, listenerMetadata, classInstance)
				break

			case "join-room":
			case "leave-room":
				this.RegisterRoomPresenceEventListener(action, namespace, listenerMetadata, classInstance)
				break

			default:
				throw new SiodInvalidMetadataError(`Unknown adapter action: ${action}`)
		}
	}

	/**
	 * Registers the listener as a room lifecycle event listener
	 * @param {string} lifecycleEvent The lifecycle event to register the listener to
	 * @param {Namespace} namespace The namespace to register the listener to
	 * @param {AdapterListenerMetadata} listenerMetadata The listener metadata to register
	 * @param {InstanceType<any>} classInstance The class instance to register the listener to
	 */
	private RegisterAsRoomLifecycleEventListener (
		lifecycleEvent: "create-room" | "delete-room",
		namespace: Namespace,
		listenerMetadata: AdapterListenerMetadata,
		classInstance: InstanceType<Any>
	) {
		namespace.adapter.on(lifecycleEvent, (room: string) => {
			const isSocketIdRoom = !!namespace.sockets.get(room)
			const isMatchingRoomFilter = this.isMatchingRoomFilter(room, listenerMetadata.roomName)

			if (!isMatchingRoomFilter || isSocketIdRoom) {
				return
			}

			classInstance[listenerMetadata.methodName](room)
		})
	}

	/**
	 * Registers the listener as a room presence event listener
	 * @param {string} presenceEvent The presence event to register the listener to
	 * @param {Namespace} namespace The namespace to register the listener to
	 * @param {AdapterListenerMetadata} listenerMetadata The listener metadata to register
	 * @param {InstanceType<any>} classInstance The class instance to register the listener to
	 */
	private RegisterRoomPresenceEventListener (
		presenceEvent: "join-room" | "leave-room",
		namespace: Namespace,
		listenerMetadata: AdapterListenerMetadata,
		classInstance: InstanceType<Any>
	) {
		namespace.adapter.on(presenceEvent, (room: string, id: string) => {
			const socket = namespace.sockets.get(id)
			if (!this.canTriggerListener(listenerMetadata, room, socket)) {
				return
			}

			classInstance[listenerMetadata.methodName](room, socket!)
		})
	}

	/**
	 * Determines if the listener can be triggered
	 * @param {AdapterListenerMetadata} listenerMetadata The listener metadata
	 * @param {string} room The joined room name
	 * @param {Socket | undefined} socket The current client socket that joined the room
	 * @returns {boolean} True if the listener can be triggered, false otherwise
	 */
	private canTriggerListener (listenerMetadata: AdapterListenerMetadata, room: string, socket?: Socket) {
		return this.isMatchingRoomFilter(room, listenerMetadata.roomName)
		&& (
			socket
			&& socket.id !== room
		)
	}

	/**
	 * Determines if the current event room matches the listener's room filter
	 * @param {string} eventRoom The current event room name
	 * @param {string | undefined} roomFilter The listener's room filter
	 * @returns {boolean} True if the event room matches the room filter, false otherwise
	 */
	private isMatchingRoomFilter (eventRoom: string, roomFilter?: string) {
		return !roomFilter || roomFilter === eventRoom
	}
}
