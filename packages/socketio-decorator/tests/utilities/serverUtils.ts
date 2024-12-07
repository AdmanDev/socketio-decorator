import http from "http"
import { Server } from "socket.io"
import Client, { Socket as ClientSocket, ManagerOptions, SocketOptions } from "socket.io-client"
import { SiodConfig } from "../../src/Models/SiodConfig"
import { useSocketIoDecorator } from "../../src/main"
import { RegisterEventAndEmitParams, ServerEventCallbacks } from "../types/functionsReturnTypes"

let port = 8000
export const ioServer: Server = {} as Server

/**
 * Creates an express server with the given siodConfig.
 * @param {SiodConfig} siodConfig The configuration for socketio-decorator
 * @param {ServerEventCallbacks} serverEventCallbacks The callbacks for the server events
 * @returns {Server} The created socket server
 */
export function createServer (siodConfig: Omit<SiodConfig, "ioserver">, serverEventCallbacks: ServerEventCallbacks): Server {
	const httpServer = http.createServer()
	const ioServer = new Server(httpServer)

	useSocketIoDecorator({
		...siodConfig,
		ioserver: ioServer,
	})

	httpServer.on("error", (err) => {
		console.error(err)
	})

	httpServer.listen(() => {
		port = (httpServer.address() as Any).port

		if (serverEventCallbacks.onServerSocketConnection) {
			ioServer.on("connection", serverEventCallbacks.onServerSocketConnection)
		}

		serverEventCallbacks.onServerListen?.()
	})

	return ioServer
}

/**
 * Creates a client socket.io socket connected to the server
 * @param {Function | undefined} done The callback to call when the client socket is connected
 * @param {boolean | undefined} autoConnect Whether to auto connect the client socket
 * @returns {ClientSocket} The client socket
 */
export function createClientSocket (done?: Function, autoConnect = true) {
	return createClientConfiguredSocket({ autoConnect }, done)
}

/**
 * Creates a client socket.io socket with the given configuration
 * @param {Partial<ManagerOptions & SocketOptions>} config The configuration for the client socket
 * @param {Function | undefined} done The callback to call when the client socket is connected
 * @returns {ClientSocket} The client socket
 */
export function createClientConfiguredSocket (config: Partial<ManagerOptions & SocketOptions>, done?: Function) {
	const clientSocket = Client(`http://localhost:${port}`, config)

	if (config.autoConnect && done) {
		clientSocket.on("connect", () => {
			done?.()
		})
	}

	return clientSocket
}

/**
 * Registers an event on the server socket and emits the event with the given data from the client socket
 * @template TData The type of the data to emit
 * @param {RegisterEventAndEmitParams<TData>} params The parameters for the event and data
 */
export function registerServerEventAndEmit<TData> (params: RegisterEventAndEmitParams<TData>) {
	const { event, data, eventCallback, serverSocket, clientSocket } = params

	serverSocket.on(event, (receivedData) => {
		setTimeout(() => {
			eventCallback(serverSocket, receivedData)
		}, 50)
	})

	clientSocket.emit(event, data)
}