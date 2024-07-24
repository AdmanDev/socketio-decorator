import { Socket } from "socket.io"

/**
 * Defines the server middleware interface
 */
export type IServerMiddleware = {
	use: (socket: Socket, next: (err?: Any) => void) => void
}