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
			case "onRoomJoined":
				this.RegisterAsOnRoomJoinedListener(namespace, listenerMetadata, classInstance)
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
	 * Determines if the listener can be triggered
	 * @param {AdapterListenerMetadata} listenerMetadata The listener metadata
	 * @param {string} room The joined room name
	 * @param {Socket | undefined} socket The current client socket that joined the room
	 * @returns {boolean} True if the listener can be triggered, false otherwise
	 */
	private canTriggerListener (listenerMetadata: AdapterListenerMetadata, room: string, socket?: Socket) {
		return (
			!listenerMetadata.roomName
			|| listenerMetadata.roomName === room
		)
		&& (
			socket
			&& socket.id !== room
		)
	}
}
