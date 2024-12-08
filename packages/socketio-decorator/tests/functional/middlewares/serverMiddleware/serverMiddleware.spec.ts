import { afterAll, afterEach, beforeAll, describe, expect, it, jest } from "@jest/globals"
import { IErrorMiddleware, IServerMiddleware, ServerOn, SocketEmitter, SocketOn } from "../../../../src"
import { Server, Socket as ServerSocket } from "socket.io"
import { Socket as ClientSocket } from "socket.io-client"
import { createConfiguredSocketClient as createConfiguredSocketClient, createSocketClient as createSocketClient, createServer } from "../../../utilities/serverUtils"
import { waitFor } from "../../../utilities/testUtils"
import { MiddlewareAction } from "../../../types/middlewareAction"

describe("> Server middleware tests", () => {
	let io: Server
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
		@SocketEmitter("connectionResp")
		public onConnection (socket: ServerSocket) {
			controllerFnSpy(socket.id)
			return 1
		}

		@SocketOn("message")
		@SocketEmitter("messageResp")
		public onMessage (socket: ServerSocket) {
			controllerFnSpy(socket.id)
			return "Hello, world!"
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
				return next(new Error("next error"))
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
				onServerListen: done
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
		it("should call server middleware before controller", (done) => {
			clientSocket = createSocketClient(undefined, false)

			clientSocket.on("connectionResp", () => {
				expect(errorMiddlewareSpy).not.toHaveBeenCalled()
				expect(serverMiddlewareSpy).toHaveBeenCalledTimes(1)
				expect(controllerFnSpy).toHaveBeenCalledTimes(1)

				expect(serverMiddlewareSpy.mock.invocationCallOrder[0]).toBeLessThan(controllerFnSpy.mock.invocationCallOrder[0])

				done()
			})

			clientSocket.connect()
		})

		it("should call server middleware only once for each client", (done) => {
			clientSocket = createSocketClient(undefined, false)

			clientSocket.on("messageResp", () => {
				expect(errorMiddlewareSpy).not.toHaveBeenCalled()
				expect(serverMiddlewareSpy).toHaveBeenCalledTimes(1)

				done()
			})

			clientSocket.connect()
			clientSocket.emit("message")
		})
	})

	describe("> Error handling", () => {
		it("should call error middleware when server middleware throws an error", async () => {
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
			expect(errorMiddlewareSpy).toHaveBeenCalledWith(expectedError, expect.any(String))
			expect(controllerFnSpy).not.toHaveBeenCalled()
		})

		it("should not call controller when next function was called with an error", async () => {
			const middlewareAction: MiddlewareAction = "nextError"

			clientSocket = createConfiguredSocketClient({
				autoConnect: false,
				query: {
					middlewareAction
				}
			})

			clientSocket.connect()

			await waitFor(50)

			expect(controllerFnSpy).not.toHaveBeenCalled()
		})
	})
})