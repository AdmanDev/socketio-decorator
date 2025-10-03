import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, jest } from "@jest/globals"
import { Server, Socket as ServerSocket } from "socket.io"
import { Socket as ClientSocket } from "socket.io-client"
import { CurrentSocket, Data, SocketOn } from "../../../../src"
import { MessageData } from "../../../types/socketData"
import { createSocketClient, createServer, registerServerEventAndEmit } from "../../../utilities/serverUtils"

describe("> SocketOn decorator", () => {
	let io: Server
	let serverSocket: ServerSocket
	let clientSocket: ClientSocket

	const controllerFnSpy = jest.fn()

	class SocketOnController {
		@SocketOn("message")
		public onMessage (@CurrentSocket() socket: ServerSocket, @Data() data: MessageData) {
			controllerFnSpy(data, socket.id)
		}
	}

	beforeAll((done) => {
		io = createServer(
			{
				controllers: [SocketOnController]
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
			const event = "message"
			const data: MessageData = { message: "Hello" }

			const onMessage = (socket: ServerSocket, data: MessageData) => {
				expect(controllerFnSpy).toHaveBeenCalledTimes(1)
				expect(controllerFnSpy).toHaveBeenCalledWith(data, socket.id)

				done()
			}

			registerServerEventAndEmit({
				eventCallback: onMessage,
				event,
				data,
				serverSocket,
				clientSocket
			})
		})
	})
})