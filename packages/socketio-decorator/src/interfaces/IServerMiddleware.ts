import { Socket } from "socket.io"

export type IServerMiddleware = {
	use: (socket: Socket, next: (err?: Any) => void) => void
}