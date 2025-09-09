import { Socket } from "socket.io"

export type EventBinder = {
	eventName: string
	namespace: string
	method: (socket: Socket) => void
}