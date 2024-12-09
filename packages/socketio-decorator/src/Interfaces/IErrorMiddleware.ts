import { Socket } from "socket.io"

/**
 * Defines the error middleware that will be used to catch errors in your event handlers.
 */
export interface IErrorMiddleware {
	/**
	 * The error handler that will be used to catch errors in your event handlers.
	 * @param {any} error The error that was thrown
	 * @param {Socket | undefined} socket The socket that was used to trigger the event
	 */
	handleError: (error: Any, socket?: Socket) => void
}