import { Event, Socket } from "socket.io"

/**
 * Defines the socket middleware interface
 */
export type ISocketMiddleware = {
	/**
	 * The middleware function to use
	 * @param {Socket} socket The socket instance
	 * @param {Event} event The socket event object
	 * @param {Function} next The next function to call
	 */
	use: (socket: Socket, event: Event, next: (err?: Error) => void) => void
}
