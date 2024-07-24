import { Event } from "socket.io"

/**
 * Defines the socket middleware interface
 */
export type ISocketMiddleware = {
	use: (event: Event, next: (err?: Error) => void) => void
}
