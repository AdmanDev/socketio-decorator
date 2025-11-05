import { Server, Socket } from "socket.io"
import { ConfigStore } from "../MetadataRepository/Stores/ConfigStore"
import { ApplicationEventBus } from "../Wrappers/AppEvent/ApplicationEventBus"
import { RoomStore } from "../Features/SocketRoom/RoomStore"
import { UseRoomReturnType } from "../Models/HookModels"

/**
 * Get the socket.io server instance
 * @returns {Server} The socket.io server instance
 */
export function useIoServer (): Server {
	return ConfigStore.get().ioserver
}

/**
 * Get the socket instance from some argument
 * @param {T} arg The argument to search the socket
 * @template T The argument type
 * @returns {Promise<Socket | null>} The socket instance
 */
export async function useUserSocket<T> (arg: T) {
	const config = ConfigStore.get()

	if (!config.searchUserSocket) {
		return null
	}

	return await config.searchUserSocket(arg)
}

/**
 * Get the application event bus instance to use it dynamically in your code
 * @returns {ApplicationEventBus} The application event bus instance
 */
export function useAppEventBus (): ApplicationEventBus {
	return ApplicationEventBus.getInstance()
}

/**
 * Get the room store instance to manage rooms data
 * @returns {RoomStore<TRoom>} The room store instance
 * @template TRoom The type of room
 */
export function useRoomStore<TRoom> (): RoomStore<TRoom> {
	return RoomStore.getInstance<TRoom>()
}

/**
 * Gets the room data and utility functions for a specific room
 * @param {string} roomName The name of the room
 * @returns {UseRoomReturnType<TRoom>} The room data and utility functions
 * @template TRoom The type of room
 */
export function useRoom<TRoom> (roomName: string): UseRoomReturnType<TRoom> {
	const io = useIoServer()
	const roomStore = useRoomStore<TRoom>()
	const room = roomStore.getRoom(roomName)

	const getClients = (): string[] => {
		const clientsSet = io.sockets.adapter.rooms.get(roomName)
		return clientsSet ? Array.from(clientsSet) : []
	}

	const isEmpty = (): boolean => {
		const clientsSet = io.sockets.adapter.rooms.get(roomName)
		return !clientsSet || clientsSet.size === 0
	}

	const hasClientInRoom = (socketId: string): boolean => {
		return io.sockets.adapter.rooms.get(roomName)?.has(socketId) || false
	}

	return {
		room,
		getClients,
		isEmpty,
		hasClientInRoom
	}
}