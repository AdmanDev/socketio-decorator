import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, jest } from "@jest/globals"
import { Server, Socket as ServerSocket } from "socket.io"
import { Socket as ClientSocket } from "socket.io-client"
import { CurrentSocket, Data, IErrorMiddleware, SiodIncomingDataError, SocketOn } from "../../../../src"
import { MessageData } from "../../../types/socketData"
import { createSocketClient, createServer, registerServerEventAndEmit } from "../../../utilities/serverUtils"

describe("> Core Data Validation Behavior", () => {
	let io: Server
	let serverSocket: ServerSocket
	let clientSocket: ClientSocket

	const controllerFnSpy = jest.fn()
	const errorMiddlewareSpy = jest.fn()

	class ErrorMiddleware implements IErrorMiddleware {
		public handleError (error: unknown) {
			errorMiddlewareSpy(error)
		}
	}

	class CoreValidationController {
		@SocketOn("test-message")
		public onMessage (@CurrentSocket() socket: ServerSocket, @Data() data: MessageData) {
			controllerFnSpy(data, socket.id)
		}
	}

	beforeAll((done) => {
		io = createServer(
			{
				controllers: [CoreValidationController],
				errorMiddleware: ErrorMiddleware,
				dataValidationEnabled: true
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

	it("should validate successfully incoming data", (done) => {
		const event = "test-message"
		const data: MessageData = { message: "Valid data" }

		const onMessage = (socket: ServerSocket, data: MessageData) => {
			expect(errorMiddlewareSpy).not.toHaveBeenCalled()
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

	it("should throw SiodIncomingDataError when data is invalid", (done) => {
		const event = "test-message"
		const data = { wrong: "data" }

		const onMessage = () => {
			expect(controllerFnSpy).not.toHaveBeenCalled()
			expect(errorMiddlewareSpy).toHaveBeenCalledTimes(1)
			expect(errorMiddlewareSpy).toHaveBeenCalledWith(expect.any(SiodIncomingDataError))

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

	it("should throw SiodIncomingDataError when data is null", (done) => {
		const event = "test-message"

		const onMessage = () => {
			expect(controllerFnSpy).not.toHaveBeenCalled()
			expect(errorMiddlewareSpy).toHaveBeenCalledTimes(1)
			expect(errorMiddlewareSpy).toHaveBeenCalledWith(expect.any(SiodIncomingDataError))

			done()
		}

		registerServerEventAndEmit({
			eventCallback: onMessage,
			data: null,
			event,
			serverSocket,
			clientSocket
		})
	})

})
