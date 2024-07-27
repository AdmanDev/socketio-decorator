import { Server, Socket } from "socket.io"
import { config } from "../globalMetadata"

/**
 * Get the socket.io server instance
 * @returns {Server} The socket.io server instance
 */
export function useIoServer (): Server {
	return config.ioserver
}

/**
 * Get the current user from the socket instance
 * @param {Socket} socket The socket instance
 * @returns {TUser | null} The current user
 * @template TUser The user type
 */
export function useCurrentUser<TUser> (socket: Socket) {
	if (!config.currentUserProvider) {
		return null
	}

	return config.currentUserProvider(socket) as TUser | null
}