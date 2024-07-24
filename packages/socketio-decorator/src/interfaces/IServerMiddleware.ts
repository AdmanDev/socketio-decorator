import { Socket } from "socket.io"

/**
 * Defines the server middleware interface
 */
export type IServerMiddleware = {
	/**
	 * The middleware function to use
	 * @param {Socket} socket The socket object
	 * @param {Function} next The next function to call
	 */
	use: (socket: Socket, next: (err?: Any) => void) => void
}