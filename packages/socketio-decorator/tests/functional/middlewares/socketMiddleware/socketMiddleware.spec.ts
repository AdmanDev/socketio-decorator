import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, jest } from "@jest/globals"
import { CurrentSocket, IErrorMiddleware, ISocketMiddleware, ServerOn, SocketEmitter, SocketOn } from "../../../../src"
import { Event, Server, Socket as ServerSocket } from "socket.io"
import { Socket as ClientSocket } from "socket.io-client"
import { createSocketClient, createServer } from "../../../utilities/serverUtils"
import { MiddlewareAction } from "../../../types/middlewareAction"
import { waitFor } from "../../../utilities/testUtils"

describe("> Socket middleware tests", () => {
	let io: Server
	let clientSocket: ClientSocket

	const controllerFnSpy = jest.fn()
	const errorMiddlewareSpy = jest.fn()
	const socketMiddlewareSpy = jest.fn()

	class ErrorMiddleware implements IErrorMiddleware {
		public handleError (error: unknown, socket?: ServerSocket) {
			errorMiddlewareSpy(error, socket?.id)
		}
	}

	class SocketMiddleware implements ISocketMiddleware {
		public use (events: Event, next: (err?: Error) => void) {
			socketMiddlewareSpy(events)

			const action = events[0] as MiddlewareAction

			if (action === "error") {
				throw new Error("error thrown")
			}

			if (action === "nextError") {
				return next(new Error("next error"))
			}

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

		@SocketOn("action")
		public onAction (@CurrentSocket() socket: ServerSocket) {
			controllerFnSpy(socket.id)
		}

		@ServerOn("error")
		public errorTest () {
			controllerFnSpy()
		}

		@ServerOn("nextError")
		public nextErrorTest () {
			controllerFnSpy()
		}
	}

	beforeAll((done) => {
		io = createServer(
			{
				controllers: [SocketMiddlewareTestController],
				errorMiddleware: ErrorMiddleware,
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
		it("should call the socket middlewares before the controller", (done) => {
			const event = "message"

			clientSocket.on("messageResp", () => {
				expect(errorMiddlewareSpy).not.toHaveBeenCalled()

				expect(socketMiddlewareSpy).toHaveBeenCalledTimes(1)
				expect(socketMiddlewareSpy).toHaveBeenCalledWith([event])

				expect(controllerFnSpy).toHaveBeenCalledTimes(1)
				expect(socketMiddlewareSpy.mock.invocationCallOrder[0]).toBeLessThan(controllerFnSpy.mock.invocationCallOrder[0])

				done()
			})

			clientSocket.emit(event)
		})

		it("should call the socket middlewares for each event", async () => {
			const event1 = "message"
			const event2 = "action"

			clientSocket.emit(event1)
			clientSocket.emit(event2)

			await waitFor(50)

			expect(socketMiddlewareSpy).toHaveBeenCalledTimes(2)
		})
	})

	describe("> Error handling tests", () => {
		it("should call error middleware when socket middleware throws an error", async () => {
			const event = "error"

			clientSocket.emit(event)

			await waitFor(50)

			expect(errorMiddlewareSpy).toHaveBeenCalledTimes(1)
			expect(errorMiddlewareSpy).toHaveBeenCalledWith(new Error("error thrown"), undefined)
			expect(controllerFnSpy).not.toHaveBeenCalled()
		})

		it("should not call controller when next function was called with an error", async () => {
			const event = "nextError"

			clientSocket.emit(event)

			await waitFor(50)

			expect(controllerFnSpy).not.toHaveBeenCalled()
		})
	})

})