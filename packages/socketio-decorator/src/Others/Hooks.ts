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
 * @deprecated This hook is deprecated and will be removed in future versions. Use `@CurrentUser()` decorator instead.
 * @param {Socket} socket The socket instance
 * @returns {Promise<TUser | null>} The current user
 * @template TUser The user type
 */
export async function useCurrentUser<TUser> (socket: Socket) {
	if (!config.currentUserProvider) { // TODO: remove this hook
		return Promise.resolve(null)
	}

	return await config.currentUserProvider(socket) as TUser | null
}

/**
 * Get the socket instance from some argument
 * @param {T} arg The argument to search the socket
 * @template T The argument type
 * @returns {Promise<Socket | null>} The socket instance
 */
export async function useUserSocket<T> (arg: T) {
	if (!config.searchUserSocket) {
		return null
	}

	return await config.searchUserSocket(arg)
}
