import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, jest } from "@jest/globals"
import { Event, Server, Socket as ServerSocket } from "socket.io"
import { IErrorMiddleware, ISocketMiddleware, SocketOn, UseSocketMiddleware } from "../../../../../src"
import { Socket as ClientSocket } from "socket.io-client"
import { createServer, createSocketClient } from "../../../../utilities/serverUtils"
import { expectCallOrder, waitFor } from "../../../../utilities/testUtils"
import { MiddlewareAction } from "../../../../types/middlewareAction"

describe("> UseSocketMiddleware Decorator (on function)", () => {
	let io: Server
	let clientSocket: ClientSocket

	const errorMiddlewareSpy = jest.fn()
	const firstSocketMiddlewareSpy = jest.fn()
	const secondSocketMiddlewareSpy = jest.fn()
	const errorSocketMiddlewareSpy = jest.fn()
	const controllerFnSpy = jest.fn()

	class ErrorMiddleware implements IErrorMiddleware {
		public handleError (err: Error): void {
			errorMiddlewareSpy(err)
		}
	}

	class FirstSocketMiddleware implements ISocketMiddleware {
		public use (events: Event, next: (err?: Error) => void): void {
			firstSocketMiddlewareSpy(events)
			next()
		}
	}

	class SecondSocketMiddleware implements ISocketMiddleware {
		public use (event: Event, next: (err?: Error) => void): void {
			secondSocketMiddlewareSpy(event)
			next()
		}
	}

	class ErrorSocketMiddleware implements ISocketMiddleware {
		public use (event: Event, next: (err?: Error) => void): void {
			errorSocketMiddlewareSpy(event)

			const action = event[1] as MiddlewareAction

			if (action === "error") {
				throw new Error("error thrown")
			}

			if (action === "nextError") {
				return next(new Error("next error"))
			}

			next()
		}
	}

	class DecoratorOnFunctionControllerTest {
		@SocketOn("simpleMiddlewareTest")
		@UseSocketMiddleware(FirstSocketMiddleware)
		simpleMiddlewareTest (socket: ServerSocket) {
			controllerFnSpy(socket.id)
			socket.emit("simpleMiddlewareTestResp")
		}

		@SocketOn("multiSocketMiddlewareTest")
		@UseSocketMiddleware(FirstSocketMiddleware, SecondSocketMiddleware)
		multiSocketMiddlewareTest (socket: ServerSocket) {
			controllerFnSpy(socket.id)
			socket.emit("multiSocketMiddlewareTestResp")
		}

		@SocketOn("errorSingleMiddlewareTest")
		@UseSocketMiddleware(ErrorSocketMiddleware)
		errorSingleMiddlewareTest (socket: ServerSocket) {
			controllerFnSpy(socket.id)
		}

		@SocketOn("errorOnFirstMiddlewareTest")
		@UseSocketMiddleware(ErrorSocketMiddleware, SecondSocketMiddleware)
		errorOnFirstMiddlewareTest (socket: ServerSocket) {
			controllerFnSpy(socket.id)
		}

		@SocketOn("errorOnSecondMiddlewareTest")
		@UseSocketMiddleware(FirstSocketMiddleware, ErrorSocketMiddleware)
		errorOnSecondMiddlewareTest (socket: ServerSocket) {
			controllerFnSpy(socket.id)
		}
	}

	beforeAll((done) => {
		io = createServer(
			{
				controllers: [DecoratorOnFunctionControllerTest],
				errorMiddleware: ErrorMiddleware
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
		it("should call the middleware before the controller when the event is emitted", (done) => {
			const event = "simpleMiddlewareTest"
			const data = { message: "Hello" }

			clientSocket.on("simpleMiddlewareTestResp", () => {
				expect(firstSocketMiddlewareSpy).toHaveBeenCalledTimes(1)
				expect(firstSocketMiddlewareSpy).toHaveBeenCalledWith([event, data])

				expect(controllerFnSpy).toHaveBeenCalledTimes(1)
				expectCallOrder(firstSocketMiddlewareSpy, controllerFnSpy)

				done()
			})

			clientSocket.emit(event, data)
		})

		it("should call multiple middlewares before the controller when the event is emitted", (done) => {
			const event = "multiSocketMiddlewareTest"
			const data = { message: "Hello" }

			clientSocket.on("multiSocketMiddlewareTestResp", () => {
				expect(firstSocketMiddlewareSpy).toHaveBeenCalledTimes(1)
				expect(firstSocketMiddlewareSpy).toHaveBeenCalledWith([event, data])

				expect(secondSocketMiddlewareSpy).toHaveBeenCalledTimes(1)
				expect(secondSocketMiddlewareSpy).toHaveBeenCalledWith([event, data])

				expect(controllerFnSpy).toHaveBeenCalledTimes(1)
				expectCallOrder(firstSocketMiddlewareSpy, secondSocketMiddlewareSpy, controllerFnSpy)

				done()
			})

			clientSocket.emit(event, data)
		})
	})

	describe("> Error handling tests", () => {
		it("should call error middleware when socket middleware throws an error", async () => {
			const event = "errorSingleMiddlewareTest"

			clientSocket.emit(event, "error")

			await waitFor(50)

			expect(errorSocketMiddlewareSpy).toHaveBeenCalledTimes(1)
			expect(errorMiddlewareSpy).toHaveBeenCalledTimes(1)
			expect(errorMiddlewareSpy).toHaveBeenCalledWith(new Error("error thrown"))
			expect(controllerFnSpy).not.toHaveBeenCalled()
		})

		it("should not call controller and error middleware when next function was called with an error", async () => {
			const event = "errorSingleMiddlewareTest"

			clientSocket.emit(event, "nextError")

			await waitFor(50)

			expect(errorSocketMiddlewareSpy).toHaveBeenCalledTimes(1)
			expect(controllerFnSpy).not.toHaveBeenCalled()
			expect(errorMiddlewareSpy).not.toHaveBeenCalled()
		})

		it.each(["error", "nextError"])("should not call next middleware when an error was thrown in a previous middleware", async (errorType) => {
			const event = "errorOnFirstMiddlewareTest"

			clientSocket.emit(event, errorType)

			await waitFor(50)

			expect(errorSocketMiddlewareSpy).toHaveBeenCalledTimes(1)
			expect(secondSocketMiddlewareSpy).not.toHaveBeenCalled()
			expect(controllerFnSpy).not.toHaveBeenCalled()

			if (errorType === "error") {
				expect(errorMiddlewareSpy).toHaveBeenCalledTimes(1)
				expect(errorMiddlewareSpy).toHaveBeenCalledWith(new Error("error thrown"))
			}
		})

		it.each(["error", "nextError"])("should call first middleware but throw an error on second middleware", async (errorType) => {
			const event = "errorOnSecondMiddlewareTest"

			clientSocket.emit(event, errorType)

			await waitFor(50)

			expect(firstSocketMiddlewareSpy).toHaveBeenCalledTimes(1)
			expect(errorSocketMiddlewareSpy).toHaveBeenCalledTimes(1)
			expect(controllerFnSpy).not.toHaveBeenCalled()

			if (errorType === "error") {
				expect(errorMiddlewareSpy).toHaveBeenCalledTimes(1)
				expect(errorMiddlewareSpy).toHaveBeenCalledWith(new Error("error thrown"))
			}
		})
	})
})