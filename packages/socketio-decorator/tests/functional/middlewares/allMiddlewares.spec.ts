import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, jest } from "@jest/globals"
import { Event, Server, Socket as ServerSocket } from "socket.io"
import { Socket as ClientSocket } from "socket.io-client"
import { CurrentSocket, IErrorMiddleware, IServerMiddleware, ISocketMiddleware, ServerEmitter, SocketOn } from "../../../src"
import { createSocketClient, createServer } from "../../utilities/serverUtils"

describe("> All Middlewares tests", () => {
	let io: Server
	let clientSocket: ClientSocket

	const controllerFnSpy = jest.fn()
	const errorMiddlewareSpy = jest.fn()
	const serverMiddlewareSpy = jest.fn()
	const socketMiddlewareSpy = jest.fn()

	class ServerMiddleware implements IServerMiddleware {
		use (socket: ServerSocket, next: (err?: unknown) => void) {
			serverMiddlewareSpy(socket.id)
			next()
		}
	}

	class SocketMiddleware implements ISocketMiddleware {
		public use (events: Event, next: (err?: Error) => void) {
			socketMiddlewareSpy(events)
			next()
		}
	}

	class ErrorMiddleware implements IErrorMiddleware {
		public handleError (error: Error, socket?: ServerSocket) {
			errorMiddlewareSpy(error, socket?.id)
		}
	}

	class TestController {
		@SocketOn("message")
		@ServerEmitter("messageResp")
		public onMessage (@CurrentSocket() socket: ServerSocket) {
			controllerFnSpy(socket.id)
			return "Hello, world!"
		}
	}

	beforeAll((done) => {
		io = createServer(
			{
				controllers: [TestController],
				errorMiddleware: ErrorMiddleware,
				serverMiddlewares: [ServerMiddleware],
				socketMiddlewares: [SocketMiddleware],
				dataValidationEnabled: true
			},
			{
				onServerListen: done
			}
		)
	})

	beforeEach((done) => {
		clientSocket = createSocketClient(done)
	})

	afterEach(() => {
		clientSocket?.disconnect()
	})

	afterAll(() => {
		io.close()
	})

	describe("> Functional tests", () => {
		it("should call all middlewares in order", (done) => {
			const event = "message"

			clientSocket.on("messageResp", () => {
				expect(errorMiddlewareSpy).not.toHaveBeenCalled()
				expect(controllerFnSpy).toHaveBeenCalledTimes(1)

				expect(serverMiddlewareSpy).toHaveBeenCalledTimes(1)
				expect(serverMiddlewareSpy).toHaveBeenCalledWith(clientSocket.id)

				expect(socketMiddlewareSpy).toHaveBeenCalledTimes(1)
				expect(socketMiddlewareSpy).toHaveBeenCalledWith([event])

				expect(serverMiddlewareSpy.mock.invocationCallOrder[0]).toBeLessThan(socketMiddlewareSpy.mock.invocationCallOrder[0])
				expect(socketMiddlewareSpy.mock.invocationCallOrder[0]).toBeLessThan(controllerFnSpy.mock.invocationCallOrder[0])

				done()
			})

			clientSocket.emit(event)
		})
	})
})