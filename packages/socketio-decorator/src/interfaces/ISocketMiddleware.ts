import { Event } from "socket.io"

/**
 * Defines the socket middleware interface
 */
export type ISocketMiddleware = {
	/**
	 * The middleware function to use
	 * @param {Event} event The socket event object
	 * @param {Function} next The next function to call
	 */
	use: (event: Event, next: (err?: Error) => void) => void
}
