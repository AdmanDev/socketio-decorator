import { Socket } from "socket.io"

export type RoomNameGetter = (args: {
	socket: Socket,
	data: Any
}) => string