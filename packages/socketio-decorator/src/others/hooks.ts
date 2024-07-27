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

/**
 * Get the socket instance from a user
 * @param {T} arg The argument to search the socket
 * @template T The argument type
 * @returns {Socket | undefined} The socket instance
 */
export function useUserSocket<T> (arg: T): Socket | undefined {
	if (!config.searchUserSocket) {
		return undefined
	}

	return config.searchUserSocket(arg)
}
