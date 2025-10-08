import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, jest } from "@jest/globals"
import { Server, Socket as ServerSocket } from "socket.io"
import { Socket as ClientSocket } from "socket.io-client"
import { CurrentSocket, Data, SocketOnce } from "../../../../src"
import { MessageData } from "../../../types/socketData"
import { createSocketClient, createServer, registerServerEventAndEmit } from "../../../utilities/serverUtils"

describe("> SocketOnce decorator", () => {
	let io: Server
	let serverSocket: ServerSocket
	let clientSocket: ClientSocket

	const controllerCallback = jest.fn()

	class SocketOnceController {
		@SocketOnce("message")
		public onMessage (@CurrentSocket() socket: ServerSocket, @Data() data: MessageData) {
			controllerCallback(data, socket.id)
		}
	}

	beforeAll((done) => {
		io = createServer(
			{
				controllers: [SocketOnceController]
			},
			{
				onServerListen: done,
				onServerSocketConnection: (socket) => {
					serverSocket = socket
				}
			}
		)
	})

	beforeEach((done) => {
		clientSocket = createSocketClient(done)
	})

	afterEach(() => {
		clientSocket.disconnect()
	})

	afterAll(() => {
		io.close()
	})

	describe("> Functional tests", () => {
		it("should register a listener for an event and dispatch the data to the controller", (done) => {
			const data: MessageData = { message: "Hello" }

			const onMessage = (socket: ServerSocket, data: MessageData) => {
				expect(controllerCallback).toHaveBeenCalledTimes(1)
				expect(controllerCallback).toHaveBeenCalledWith(data, socket.id)

				done()
			}

			registerServerEventAndEmit({
				eventCallback: onMessage,
				event: "message",
				data,
				serverSocket,
				clientSocket
			})
		})

		it("should listen one-time for an event", (done) => {
			const event = "message"
			const data: MessageData = { message: "Hello" }

			serverSocket.once(event, (receivedData) => {
				setTimeout(() => {
					expect(controllerCallback).toHaveBeenCalledTimes(1)
					expect(controllerCallback).toHaveBeenCalledWith(receivedData, serverSocket.id)

					done()
				}, 500)
			})

			clientSocket.emit(event, data)
			clientSocket.emit(event, data)
		})
	})
})