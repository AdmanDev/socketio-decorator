import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, jest } from "@jest/globals"
import { EmitterOption, IErrorMiddleware, ServerEmitter, SiodImcomigDataError, SiodInvalidArgumentError, SocketEmitter, SocketOn } from "../../../src"
import { MessageData } from "../../types/socketData"
import { Server, Socket as ServerSocket } from "socket.io"
import { Socket as ClientSocket } from "socket.io-client"
import { createClientSocket, createServer, registerServerEventAndEmit } from "../../utilities/serverUtils"
import { getInstance } from "../../../src/container"
import { waitFor } from "../../utilities/testUtils"

describe("> ErrorMiddleware decorator", () => {
	let io: Server
	let serverSocket: ServerSocket
	let clientSocket: ClientSocket

	const controllerFnSpy = jest.fn()
	const errorMiddlewareSpy = jest.fn()

	class ErrorMiddleware implements IErrorMiddleware {
		public handleError (error: unknown, socket?: ServerSocket) {
			errorMiddlewareSpy(error, socket?.id)
		}
	}

	class ErrorTestController {
		@SocketOn("testControllerError")
		public testControllerError (socket: ServerSocket) {
			controllerFnSpy(socket.id)
			throw new Error(`test controller error : socket id ${socket.id}`)
		}

		@SocketOn("testWithData")
		public testWithData (socket: ServerSocket, data: MessageData) {
			controllerFnSpy(data, socket.id)
		}

		@ServerEmitter()
		public testServerEmitterErrorHandling () {
			return new EmitterOption({
				to: clientSocket.id,
				message: "", // Empty message should trigger an error
				data: null
			})
		}

		@SocketOn("testSocketEmitterErrorHandling")
		@SocketEmitter()
		public testSocketEmitterErrorHandling () {
			return new EmitterOption({
				to: clientSocket.id,
				message: "", // Empty message should trigger an error
				data: null
			})
		}
	}

	beforeAll((done) => {
		io = createServer(
			{
				controllers: [ErrorTestController],
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
		it("should not call the error middleware when no error is thrown", (done) => {
			const event = "testWithData"
			const data: MessageData = { message: "Hello" }

			const onTestWithData = () => {
				expect(controllerFnSpy).toHaveBeenCalledTimes(1)
				expect(errorMiddlewareSpy).not.toHaveBeenCalled()

				done()
			}

			registerServerEventAndEmit({
				eventCallback: onTestWithData,
				event,
				data,
				serverSocket,
				clientSocket
			})
		})

		it("should call the error middleware when the controller throws an error", (done) => {
			const event = "testControllerError"
			const expectedError = new Error(`test controller error : socket id ${clientSocket.id}`)

			const onTestControllerError = () => {
				expect(controllerFnSpy).toHaveBeenCalledTimes(1)
				expect(controllerFnSpy).toHaveBeenCalledWith(clientSocket.id)

				expect(errorMiddlewareSpy).toHaveBeenCalledTimes(1)
				expect(errorMiddlewareSpy).toHaveBeenCalledWith(expectedError, clientSocket.id)

				done()
			}

			registerServerEventAndEmit({
				eventCallback: onTestControllerError,
				event,
				data: null,
				serverSocket,
				clientSocket
			})
		})

		it("should call the error middleware when data is not valid", (done) => {
			const event = "testWithData"
			const data = { wrong: "data" }

			const onTestWithData = () => {
				expect(controllerFnSpy).not.toHaveBeenCalled()
				expect(errorMiddlewareSpy).toHaveBeenCalledTimes(1)
				expect(errorMiddlewareSpy).toHaveBeenCalledWith(expect.any(SiodImcomigDataError), clientSocket.id)

				done()
			}

			registerServerEventAndEmit({
				eventCallback: onTestWithData,
				event,
				data,
				serverSocket,
				clientSocket
			})
		})

		it("should call the error middleware when an error is thrown from a server emitter binder method", async () => {
			const controllerInstance = getInstance<ErrorTestController>(ErrorTestController)

			controllerInstance.testServerEmitterErrorHandling()

			await waitFor(50)

			expect(errorMiddlewareSpy).toHaveBeenCalledTimes(1)
			expect(errorMiddlewareSpy).toHaveBeenCalledWith(expect.any(SiodInvalidArgumentError), undefined)
		})

		it("should call the error middleware when an error is thrown from a socket emitter binder method", async () => {
			clientSocket.emit("testSocketEmitterErrorHandling")

			await waitFor(50)

			expect(errorMiddlewareSpy).toHaveBeenCalledTimes(1)
			expect(errorMiddlewareSpy).toHaveBeenCalledWith(expect.any(SiodInvalidArgumentError), clientSocket.id)
		})
	})
})