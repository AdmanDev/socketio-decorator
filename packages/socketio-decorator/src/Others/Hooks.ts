import { Server, Socket } from "socket.io"
import { ConfigStore } from "../MetadataRepository/Stores/ConfigStore"

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
