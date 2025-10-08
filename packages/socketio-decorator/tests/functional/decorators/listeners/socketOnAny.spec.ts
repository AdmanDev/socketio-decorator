import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, jest } from "@jest/globals"
import { Server, Socket as ServerSocket } from "socket.io"
import { Socket as ClientSocket } from "socket.io-client"
import { CurrentSocket, Data, EventName, SocketOnAny } from "../../../../src"
import { MessageData } from "../../../types/socketData"
import { createSocketClient, createServer, registerServerEventAndEmit } from "../../../utilities/serverUtils"

describe("> SocketOnAny decorator", () => {
	let io: Server
	let serverSocket: ServerSocket
	let clientSocket: ClientSocket

	const onMessageSpy = jest.fn()

	class SocketOnAnyController {
		@SocketOnAny()
		public onAny (@CurrentSocket() socket: ServerSocket, @EventName() event: string, @Data() data: MessageData) {
			onMessageSpy(socket.id, event, data)
		}
	}

	beforeAll((done) => {
		io = createServer(
			{
				controllers: [SocketOnAnyController]
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
		it("should register a listener for any event and dispatch the data to the controller", (done) => {
			const event = "message"
			const data: MessageData = { message: "Hello" }

			const onMessage = (socket: ServerSocket, data: MessageData) => {
				expect(onMessageSpy).toHaveBeenCalledTimes(1)
				expect(onMessageSpy).toHaveBeenCalledWith(socket.id, event, data)

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