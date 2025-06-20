import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, jest } from "@jest/globals"
import { Server, Socket as ServerSocket } from "socket.io"
import { Socket as ClientSocket } from "socket.io-client"
import { CurrentSocket, Data, IErrorMiddleware, SiodImcomigDataError, SocketOn } from "../../../../src"
import { MessageData } from "../../../types/socketData"
import { createSocketClient, createServer, registerServerEventAndEmit } from "../../../utilities/serverUtils"

describe("> SocketOn decorator", () => {
	let io: Server
	let serverSocket: ServerSocket
	let clientSocket: ClientSocket

	const controllerFnSpy = jest.fn()
	const disconnectSpy = jest.fn()
	const errorMiddlewareSpy = jest.fn()

	class ErrorMiddleware implements IErrorMiddleware {
		public handleError (error: unknown) {
			errorMiddlewareSpy(error)
		}
	}

	class SocketOnController {
		@SocketOn("message")
		public onMessage (@CurrentSocket() socket: ServerSocket, @Data() data: MessageData) {
			controllerFnSpy(data, socket.id)
		}

		@SocketOn("no-data-validation", { disableDataValidation: true })
		public onNoDataValidation (@CurrentSocket() socket: ServerSocket, @Data() data: MessageData) {
			controllerFnSpy(data, socket.id)
		}

		@SocketOn("disconnecting")
		public onDisconnecting (@CurrentSocket() socket: ServerSocket, @Data() wrongData: MessageData) {
			disconnectSpy(wrongData)
		}

		@SocketOn("disconnect")
		public onDisconnect (@Data() wrongData: MessageData) {
			disconnectSpy(wrongData)
		}
	}

	beforeAll((done) => {
		io = createServer(
			{
				controllers: [SocketOnController],
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

	describe("> Data validation tests", () => {
		it("should throw an error if the data is not valid", (done) => {
			const event = "message"
			const data = { wrong: "data" }

			const onMessage = () => {
				expect(controllerFnSpy).not.toHaveBeenCalled()
				expect(errorMiddlewareSpy).toHaveBeenCalledTimes(1)
				expect(errorMiddlewareSpy).toHaveBeenCalledWith(expect.any(SiodImcomigDataError))

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
				expect(controllerFnSpy).not.toHaveBeenCalled()
				expect(errorMiddlewareSpy).toHaveBeenCalledTimes(1)
				expect(errorMiddlewareSpy).toHaveBeenCalledWith(expect.any(SiodImcomigDataError))

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
				expect(errorMiddlewareSpy).not.toHaveBeenCalled()
				expect(controllerFnSpy).toHaveBeenCalledTimes(1)
				expect(controllerFnSpy).toHaveBeenCalledWith(data, expect.any(String))

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
			disconnectSpy.mockClear()

			serverSocket.on("disconnect", () => {
				expect(errorMiddlewareSpy).not.toHaveBeenCalled()
				expect(disconnectSpy).toHaveBeenCalled()

				done()
			})

			clientSocket.disconnect()
		})
	})
})