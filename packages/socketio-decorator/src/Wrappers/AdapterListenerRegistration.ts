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

		switch (listenerMetadata.action) {
			case "onRoomCreated":
				this.RegisterAsOnRoomCreatedListener(namespace, listenerMetadata, classInstance)
				break

			case "onRoomDeleted":
				this.RegisterAsOnRoomDeletedListener(namespace, listenerMetadata, classInstance)
				break

			case "onRoomJoined":
				this.RegisterAsOnRoomJoinedListener(namespace, listenerMetadata, classInstance)
				break

			case "onRoomLeft":
				this.RegisterAsOnRoomLeftListener(namespace, listenerMetadata, classInstance)
				break

			default:
				throw new SiodInvalidMetadataError(`Unknown adapter action: ${listenerMetadata.action}`)
		}
	}

	/**
	 * Registers the listener as an on room joined listener
	 * @param {Namespace} namespace The namespace to register the listener to
	 * @param {AdapterListenerMetadata} listenerMetadata The listener metadata to register
	 * @param {InstanceType<any>} classInstance The class instance to register the listener to
	 */
	private RegisterAsOnRoomJoinedListener (
		namespace: Namespace,
		listenerMetadata: AdapterListenerMetadata,
		classInstance: InstanceType<Any>
	) {
		namespace.adapter.on("join-room", (room: string, id: string) => {
			const socket = namespace.sockets.get(id)
			if (!this.canTriggerListener(listenerMetadata, room, socket)) {
				return
			}

			classInstance[listenerMetadata.methodName](room, socket!)
		})
	}

	/**
	 * Registers the listener as an on room left listener
	 * @param {Namespace} namespace The namespace to register the listener to
	 * @param {AdapterListenerMetadata} listenerMetadata The listener metadata to register
	 * @param {InstanceType<any>} classInstance The class instance to register the listener to
	 */
	private RegisterAsOnRoomLeftListener (
		namespace: Namespace,
		listenerMetadata: AdapterListenerMetadata,
		classInstance: InstanceType<Any>
	) {
		namespace.adapter.on("leave-room", (room: string, id: string) => {
			const socket = namespace.sockets.get(id)
			if (!this.canTriggerListener(listenerMetadata, room, socket)) {
				return
			}

			classInstance[listenerMetadata.methodName](room, socket!)
		})
	}

	/**
	 * Registers the listener as an on room created listener
	 * @param {Namespace} namespace The namespace to register the listener to
	 * @param {AdapterListenerMetadata} listenerMetadata The listener metadata to register
	 * @param {InstanceType<any>} classInstance The class instance to register the listener to
	 */
	private RegisterAsOnRoomCreatedListener (
		namespace: Namespace,
		listenerMetadata: AdapterListenerMetadata,
		classInstance: InstanceType<Any>
	) {
		namespace.adapter.on("create-room", (room: string) => {
			const isSocketIdRoom = !!namespace.sockets.get(room)
			const isMatchingRoomFilter = this.isMatchingRoomFilter(room, listenerMetadata.roomName)

			if (!isMatchingRoomFilter || isSocketIdRoom) {
				return
			}

			classInstance[listenerMetadata.methodName](room)
		})
	}

	/**
	 * Registers the listener as an on room deleted listener
	 * @param {Namespace} namespace The namespace to register the listener to
	 * @param {AdapterListenerMetadata} listenerMetadata The listener metadata to register
	 * @param {InstanceType<any>} classInstance The class instance to register the listener to
	 */
	private RegisterAsOnRoomDeletedListener (
		namespace: Namespace,
		listenerMetadata: AdapterListenerMetadata,
		classInstance: InstanceType<Any>
	) {
		namespace.adapter.on("delete-room", (room: string) => {
			const isSocketIdRoom = !!namespace.sockets.get(room)
			const isMatchingRoomFilter = this.isMatchingRoomFilter(room, listenerMetadata.roomName)

			if (!isMatchingRoomFilter || isSocketIdRoom) {
				return
			}

			classInstance[listenerMetadata.methodName](room)
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
