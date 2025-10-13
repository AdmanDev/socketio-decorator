import { Namespace, Server, Socket } from "socket.io"
import { AdapterListenerEntry, AdapterListenerMetadataStore } from "../MetadataRepository/Stores/AdapterListenerMetadataStore"
import { ConfigStore } from "../MetadataRepository/Stores/ConfigStore"
import { Operation } from "./WrapperCore/Operation/Operation"
import { SiodInvalidMetadataError } from "../Models/Errors/SiodInvalidMetadataError"
import { IoCContainer } from "../IoCContainer"

/**
 * Registers adapter listeners independently from controllers
 */
export class AdapterListenerRegistration extends Operation {
	/** @inheritdoc */
	public execute () {
		const ioserver = ConfigStore.get().ioserver
		const listeners = AdapterListenerMetadataStore.getAll()

		listeners.forEach(listenerEntry => {
			this.registerAdapterListener(ioserver, listenerEntry)
		})
	}

	/**
	 * Registers a single adapter listener
	 * @param {Server} ioserver The Socket.IO server instance
	 * @param {AdapterListenerEntry} listenerEntry The listener entry to register
	 */
	private registerAdapterListener (ioserver: Server, listenerEntry: AdapterListenerEntry) {
		const namespace = ioserver.of(listenerEntry.namespace)

		const classInstance = IoCContainer.getInstance<InstanceType<Any>>(listenerEntry.targetClass)

		switch (listenerEntry.action) {
			case "onRoomJoined":
				this.RegisterAsOnRoomJoinedListener(namespace, listenerEntry, classInstance)
				break

			default:
				throw new SiodInvalidMetadataError(`Unknown adapter action: ${listenerEntry.action}`)
		}
	}

	/**
	 * Registers the listener as an on room joined listener
	 * @param {Namespace} namespace The namespace to register the listener to
	 * @param {AdapterListenerEntry} listenerEntry The listener entry to register
	 * @param {InstanceType<any>} classInstance The class instance to register the listener to
	 */
	private RegisterAsOnRoomJoinedListener (
		namespace: Namespace,
		listenerEntry: AdapterListenerEntry,
		classInstance: InstanceType<Any>
	) {
		namespace.adapter.on("join-room", (room: string, id: string) => {
			const socket = namespace.sockets.get(id)
			if (!this.canTriggerListener(listenerEntry, room, socket)) {
				return
			}

			classInstance[listenerEntry.methodName](room, socket!)
		})
	}

	/**
	 * Determines if the listener can be triggered
	 * @param {AdapterListenerEntry} listenerEntry The listener entry
	 * @param {string} room The joined room name
	 * @param {Socket | undefined} socket The current client socket that joined the room
	 * @returns {boolean} True if the listener can be triggered, false otherwise
	 */
	private canTriggerListener (listenerEntry: AdapterListenerEntry, room: string, socket?: Socket) {
		return (
			!listenerEntry.roomName
			|| listenerEntry.roomName === room
		)
		&& (
			socket
			&& socket.id !== room
		)
	}
}
