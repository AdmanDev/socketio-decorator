import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, jest } from "@jest/globals"
import { Server, Socket as ServerSocket } from "socket.io"
import { Socket as ClientSocket } from "socket.io-client"
import { IErrorMiddleware, SiodImcomigDataError, SocketOnce } from "../../../../src"
import { MessageData } from "../../../types/socketData"
import { createSocketClient, createServer, registerServerEventAndEmit } from "../../../utilities/serverUtils"

describe("> SocketOnce decorator", () => {
	let io: Server
	let serverSocket: ServerSocket
	let clientSocket: ClientSocket

	const controllerCallback = jest.fn()
	const disconnectCallback = jest.fn()
	const errorMiddlewareCallback = jest.fn()

	class ErrorMiddleware implements IErrorMiddleware {
		public handleError (error: unknown) {
			errorMiddlewareCallback(error)
		}
	}

	class SocketOnceController {
		@SocketOnce("message")
		public onMessage (socket: ServerSocket, data: MessageData) {
			controllerCallback(data, socket.id)
		}

		@SocketOnce("no-data-validation", { disableDataValidation: true })
		public onNoDataValidation (socket: ServerSocket, data: MessageData) {
			controllerCallback(data, socket.id)
		}

		@SocketOnce("disconnecting")
		public onDisconnecting (wrongData: MessageData) {
			disconnectCallback(wrongData)
		}

		@SocketOnce("disconnect")
		public onDisconnect (wrongData: MessageData) {
			disconnectCallback(wrongData)
		}
	}

	beforeAll((done) => {
		io = createServer(
			{
				controllers: [SocketOnceController],
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

	describe("> Data validation tests", () => {
		it("should throw an error if the data is not valid", (done) => {
			const event = "message"
			const data = { wrong: "data" }

			const onMessage = () => {
				expect(controllerCallback).not.toHaveBeenCalled()
				expect(errorMiddlewareCallback).toHaveBeenCalledTimes(1)
				expect(errorMiddlewareCallback).toHaveBeenCalledWith(expect.any(SiodImcomigDataError))

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

		it("should throw an error if the data is null", (done) => {
			const event = "message"

			const onMessage = () => {
				expect(controllerCallback).not.toHaveBeenCalled()
				expect(errorMiddlewareCallback).toHaveBeenCalledTimes(1)
				expect(errorMiddlewareCallback).toHaveBeenCalledWith(expect.any(SiodImcomigDataError))

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

		it("should not throw an error if the data validation is disabled", (done) => {
			const event = "no-data-validation"
			const data = { wrong: "data" }

			const onNoDataValidation = () => {
				expect(errorMiddlewareCallback).not.toHaveBeenCalled()
				expect(controllerCallback).toHaveBeenCalledTimes(1)
				expect(controllerCallback).toHaveBeenCalledWith(data, expect.any(String))

				done()
			}

			registerServerEventAndEmit({
				eventCallback: onNoDataValidation,
				event,
				data,
				serverSocket,
				clientSocket
			})
		})

		it("should not validate the data on DISCONNECT and DISCONNECTING event", (done) => {
			disconnectCallback.mockClear()

			serverSocket.on("disconnect", () => {
				expect(errorMiddlewareCallback).not.toHaveBeenCalled()
				expect(disconnectCallback).toHaveBeenCalled()

				done()
			})

			clientSocket.disconnect()
		})
	})
})