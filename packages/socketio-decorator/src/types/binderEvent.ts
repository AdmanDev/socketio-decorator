import { Socket } from "socket.io"

export type BinderEvent = {
	eventName: string
	method: (socket: Socket) => void
}