import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, jest } from "@jest/globals"
import { Server, Socket as ServerSocket } from "socket.io"
import { Socket as ClientSocket } from "socket.io-client"
import { IErrorMiddleware, SiodImcomigDataError, SocketOnAny } from "../../../../src"
import { MessageData } from "../../../types/socketData"
import { createClientSocket, createServer, registerServerEventAndEmit } from "../../../utilities/serverUtils"

describe("> SocketOnAny decorator", () => {
	let io: Server
	let serverSocket: ServerSocket
	let clientSocket: ClientSocket

	const onMessageSpy = jest.fn()
	const onNoDataValidationSpy = jest.fn()
	const errorMiddlewareSpy = jest.fn()

	class ErrorMiddleware implements IErrorMiddleware {
		public handleError (error: unknown) {
			errorMiddlewareSpy(error)
		}
	}

	class SocketOnAnyController {
		@SocketOnAny({ disableDataValidation: false })
		public onMessage (socket: ServerSocket, event: string, data: MessageData) {
			onMessageSpy(socket.id, event, data)
		}

		@SocketOnAny()
		public onNoDataValidation (socket: ServerSocket, event: string, data: MessageData) {
			onNoDataValidationSpy(data, socket.id)
		}
	}

	beforeAll((done) => {
		io = createServer(
			{
				controllers: [SocketOnAnyController],
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
		clientSocket = createClientSocket(done)
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
				expect(errorMiddlewareSpy).not.toHaveBeenCalled()
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

	describe("> Data validation tests", () => {
		it("should throw an error if the data is not valid", (done) => {
			const event = "message"
			const data = { wrong: "data" }

			const onMessage = () => {
				expect(onMessageSpy).not.toHaveBeenCalled()
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
				expect(onMessageSpy).not.toHaveBeenCalled()
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
				//Expect(errorMiddlewareSpy).not.toHaveBeenCalled()
				expect(onNoDataValidationSpy).toHaveBeenCalledTimes(1)
				expect(onNoDataValidationSpy).toHaveBeenCalledWith(data, expect.any(String))

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
	})
})