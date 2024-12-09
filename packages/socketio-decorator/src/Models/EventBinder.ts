import { Socket } from "socket.io"

export type EventBinder = {
	eventName: string
	method: (socket: Socket) => void
}