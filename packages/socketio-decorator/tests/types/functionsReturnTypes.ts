import { Socket as ServerSocket } from "socket.io"
import { Socket as ClientSocket } from "socket.io-client"

export type ConnectSocketReturnType = {
	serverSocket: ServerSocket,
	clientSocket: ClientSocket
}

export type ServerEventCallbacks = {
	onServerSocketConnection?: (socket: ServerSocket) => void,
	onServerListen?: () => void
}

export type RegisterEventAndEmitParams<TData> = {
	event: string,
	data: TData,
	eventCallback: (socket: ServerSocket, data: TData) => void,
	serverSocket: ServerSocket,
	clientSocket: ClientSocket,
}
