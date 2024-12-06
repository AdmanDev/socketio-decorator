import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, jest } from "@jest/globals"
import { EmitterOption, IErrorMiddleware, IServerMiddleware, ServerEmitter, ServerOn, SiodImcomigDataError, SiodInvalidArgumentError, SocketEmitter, SocketOn } from "../../../src"
import { MessageData } from "../../types/socketData"
import { Server, Socket as ServerSocket } from "socket.io"
import { Socket as ClientSocket } from "socket.io-client"
import { createClientConfiguredSocket as createConfiguredSocketClient, createClientSocket as createSocketClient, createServer, registerServerEventAndEmit } from "../../utilities/serverUtils"
import { getInstance } from "../../../src/container"
import { waitFor } from "../../utilities/testUtils"
import { MiddlewareAction } from "../../types/middlewareAction"

describe("> ErrorMiddleware decorator", () => {
	let io: Server
	let serverSocket: ServerSocket
	let clientSocket: ClientSocket

	const controllerFnSpy = jest.fn()
	const errorMiddlewareSpy = jest.fn()
	const serverMiddlewareSpy = jest.fn()

	class ErrorMiddleware implements IErrorMiddleware {
		public handleError (error: unknown, socket?: ServerSocket) {
			errorMiddlewareSpy(error, socket?.id)
		}
	}

	class ServerMiddlewareTestController {
		@ServerOn("connection")
		@SocketEmitter("newMessage")
		public onConnection (socket: ServerSocket) {
			controllerFnSpy(socket.id)
		}
	}

	class ServerMiddleware implements IServerMiddleware {
		use (socket: ServerSocket, next: (err?: unknown) => void) {
			serverMiddlewareSpy(socket.id)

			const action = socket.handshake.query.middlewareAction as MiddlewareAction | undefined

			if (action === "error") {
				throw new Error("error thrown")
			}

			if (action === "nextError") {
				next(new Error("next error"))
			}

			next()
		}
	}

	beforeAll((done) => {
		io = createServer(
			{
				controllers: [ServerMiddlewareTestController],
				errorMiddleware: ErrorMiddleware,
				serverMiddlewares: [ServerMiddleware],
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

	afterEach(() => {
		clientSocket?.disconnect()
	})

	afterAll(() => {
		io.close()
	})

	describe("> Functional tests", () => {
		it("should execute server middleware before controller", (done) => {
			clientSocket = createSocketClient(undefined, false)

			clientSocket.on("newMessage", () => {
				expect(errorMiddlewareSpy).not.toHaveBeenCalled()
				expect(serverMiddlewareSpy).toHaveBeenCalledTimes(1)
				expect(controllerFnSpy).toHaveBeenCalledTimes(1)

				expect(serverMiddlewareSpy.mock.invocationCallOrder[0]).toBeLessThan(controllerFnSpy.mock.invocationCallOrder[0])

				done()
			})

			clientSocket.connect()
		})
	})

	describe("> Error tests", () => {
		it.only("should execute error middleware when server middleware throws an error", async () => {
			const middlewareAction: MiddlewareAction = "error"
			const expectedError = new Error("error thrown")

			clientSocket = createConfiguredSocketClient({
				autoConnect: false,
				query: {
					middlewareAction
				}
			})

			clientSocket.connect()

			await waitFor(50)

			expect(errorMiddlewareSpy).toHaveBeenCalledTimes(1)
			expect(errorMiddlewareSpy).toHaveBeenCalledWith(expectedError, clientSocket.id)
			expect(controllerFnSpy).not.toHaveBeenCalled()
		})
	})
})