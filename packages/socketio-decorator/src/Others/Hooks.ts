import { Server, Socket } from "socket.io"
import { ConfigStore } from "../MetadataRepository/Stores/ConfigStore"
import { ApplicationEventBus } from "../Wrappers/AppEvent/ApplicationEventBus"
import { RoomStore } from "../Features/SocketRoom/RoomStore"

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