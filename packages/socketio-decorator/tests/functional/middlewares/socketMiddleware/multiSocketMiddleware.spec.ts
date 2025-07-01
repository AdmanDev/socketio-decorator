import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, jest } from "@jest/globals"
import { CurrentSocket, IErrorMiddleware, ISocketMiddleware, SocketEmitter, SocketOn } from "../../../../src"
import { Event, Server, Socket as ServerSocket } from "socket.io"
import { Socket as ClientSocket } from "socket.io-client"
import { createSocketClient, createServer } from "../../../utilities/serverUtils"

describe("> Multi socket middleware tests", () => {
	let io: Server
	let clientSocket: ClientSocket

	const controllerFnSpy = jest.fn()
	const errorMiddlewareSpy = jest.fn()
	const firstSocketMiddlewareSpy = jest.fn()
	const secondSocketMiddlewareSpy = jest.fn()

	class ErrorMiddleware implements IErrorMiddleware {
		public handleError (error: unknown, socket?: ServerSocket) {
			errorMiddlewareSpy(error, socket?.id)
		}
	}

	class FirstSocketMiddleware implements ISocketMiddleware {
		public use (socket: ServerSocket, events: Event, next: (err?: Error) => void) {
			firstSocketMiddlewareSpy(socket.id, events)
			next()
		}

	}

	class SecondSocketMiddleware implements ISocketMiddleware {
		public use (socket: ServerSocket, events: Event, next: (err?: Error) => void) {
			secondSocketMiddlewareSpy(socket.id, events)
			next()
		}

	}

	class SocketMiddlewareTestController {
		@SocketOn("message")
		@SocketEmitter("messageResp")
		public onMessage (@CurrentSocket() socket: ServerSocket) {
			controllerFnSpy(socket.id)
			return "Hello, world!"
		}
	}

	beforeAll((done) => {
		io = createServer(
			{
				controllers: [SocketMiddlewareTestController],
				errorMiddleware: ErrorMiddleware,
				socketMiddlewares: [FirstSocketMiddleware, SecondSocketMiddleware],
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
		it("should call both first and second socket middlewares in order", (done) => {
			const event = "message"

			clientSocket.on("messageResp", () => {
				expect(errorMiddlewareSpy).not.toHaveBeenCalled()
				expect(controllerFnSpy).toHaveBeenCalledTimes(1)

				expect(firstSocketMiddlewareSpy).toHaveBeenCalledTimes(1)
				expect(firstSocketMiddlewareSpy).toHaveBeenCalledWith(clientSocket.id, [event])

				expect(secondSocketMiddlewareSpy).toHaveBeenCalledTimes(1)
				expect(secondSocketMiddlewareSpy).toHaveBeenCalledWith(clientSocket.id, [event])

				expect(firstSocketMiddlewareSpy.mock.invocationCallOrder[0]).toBeLessThan(secondSocketMiddlewareSpy.mock.invocationCallOrder[0])
				expect(secondSocketMiddlewareSpy.mock.invocationCallOrder[0]).toBeLessThan(controllerFnSpy.mock.invocationCallOrder[0])

				done()
			})

			clientSocket.emit(event)
		})
	})

})