import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, jest } from "@jest/globals"
import { Event, Server, Socket as ServerSocket } from "socket.io"
import { Socket as ClientSocket } from "socket.io-client"
import { createServer, createSocketClient } from "../../../../utilities/serverUtils"
import { IErrorMiddleware, ISocketMiddleware, ServerOn, SocketOn, UseSocketMiddleware } from "../../../../../src"
import { MessageData } from "../../../../types/socketData"
import { expectCallOrder, waitFor } from "../../../../utilities/testUtils"
import { MiddlewareAction } from "../../../../types/middlewareAction"

describe("> UseSocketMiddleware Decorator (on controller class)", () => {
	let io: Server
	let clientSocket: ClientSocket

	const connectionFnSpy = jest.fn()
	const errorMiddlewareSpy = jest.fn()
	const firstSocketMiddlewareSpy = jest.fn()
	const secondSocketMiddlewareSpy = jest.fn()
	const serverListenerTestSocketMiddlewareSpy = jest.fn()
	const errorSocketMiddlewareSpy = jest.fn()
	const listenerFnSpy = jest.fn()
	const secondListenerFnSpy = jest.fn()
	const noListenerFnSpy = jest.fn()

	class ErrorMiddleware implements IErrorMiddleware {
		public handleError (err: Error): void {
			errorMiddlewareSpy(err)
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

	class FirstSocketMiddleware implements ISocketMiddleware {
		public use (event: Event, next: (err?: Error) => void) {
			firstSocketMiddlewareSpy(event)
			next()
		}
	}

	class SecondSocketMiddleware implements ISocketMiddleware {
		public use (event: Event, next: (err?: Error) => void) {
			secondSocketMiddlewareSpy(event)
			next()
		}
	}

	class SocketMiddlewareForServerListenerTest implements ISocketMiddleware {
		public use (event: Event, next: (err?: Error) => void) {
			serverListenerTestSocketMiddlewareSpy(event)
			next()
		}
	}

	@UseSocketMiddleware(FirstSocketMiddleware)
	class ControllerWithOneListenerTest {
		@SocketOn("simpleEventTest")
		simpleEventTest (socket: ServerSocket, data: unknown) {
			listenerFnSpy(socket.id, data)
			socket.emit("simpleMiddlewareTestResp")
		}

		noListenerTest () {
			noListenerFnSpy()
		}
	}

	@UseSocketMiddleware(FirstSocketMiddleware)
	class ControllerWithManyListenersTest {
		@SocketOn("firstListenerTest")
		firstListenerTest (socket: ServerSocket, data: unknown) {
			listenerFnSpy(socket.id, data)
			socket.emit("firstListenerTestResp")
		}

		@SocketOn("secondListenerTest")
		secondListenerTest (socket: ServerSocket, data: unknown) {
			secondListenerFnSpy(socket.id, data)
			socket.emit("secondListenerTestResp")
		}
	}

	@UseSocketMiddleware(FirstSocketMiddleware, SecondSocketMiddleware)
	class ControllerWithManyMiddlewaresTest {
		@SocketOn("simpleEventWithManyMiddlewaresTest")
		simpleEventWithManyMiddlewaresTest (socket: ServerSocket, data: unknown) {
			listenerFnSpy(socket.id, data)
			socket.emit("simpleEventWithManyMiddlewaresTestResp")
		}

		noListenerTest () {
			noListenerFnSpy()
		}
	}

	@UseSocketMiddleware(FirstSocketMiddleware, ErrorSocketMiddleware, SecondSocketMiddleware)
	class ControllerWithErrorMiddlewareTest {
		@SocketOn("errorEventTest")
		errorEventTest (socket: ServerSocket, data: unknown) {
			listenerFnSpy(socket.id, data)
		}
	}

	@UseSocketMiddleware(SocketMiddlewareForServerListenerTest)
	class ControllerWithServerListenerTest {
		@ServerOn("connection")
		connection (socket: ServerSocket) {
			connectionFnSpy(socket.id)
		}

		@SocketOn("serverListenerTest")
		serverListenerTest (socket: ServerSocket) {
			listenerFnSpy(socket.id)
			socket.emit("serverListenerTestResp")
		}
	}

	beforeAll((done) => {
		io = createServer(
			{
				controllers: [
					ControllerWithOneListenerTest,
					ControllerWithManyListenersTest,
					ControllerWithManyMiddlewaresTest,
					ControllerWithErrorMiddlewareTest,
					ControllerWithServerListenerTest
				],
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
		it("should call the middleware before the controller when an event is emitted", (done) => {
			const event = "simpleEventTest"
			const data: MessageData = { message: "Hello" }

			clientSocket.on("simpleMiddlewareTestResp", () => {
				expect(firstSocketMiddlewareSpy).toHaveBeenCalledTimes(1)
				expect(firstSocketMiddlewareSpy).toHaveBeenCalledWith([event, data])

				expect(listenerFnSpy).toHaveBeenCalledTimes(1)
				expect(listenerFnSpy).toHaveBeenCalledWith(clientSocket.id, data)

				expect(noListenerFnSpy).not.toHaveBeenCalled()

				expectCallOrder(firstSocketMiddlewareSpy, listenerFnSpy)

				done()
			})

			clientSocket.emit(event, data)
		})

		it("should call the middleware before all listeners", async () => {
			const firstEvent = "firstListenerTest"
			const secondEvent = "secondListenerTest"
			const data: MessageData = { message: "Hello" }

			clientSocket.emit(firstEvent, data)
			clientSocket.emit(secondEvent, data)

			await waitFor(50)

			expect(firstSocketMiddlewareSpy).toHaveBeenCalledTimes(2)
			expect(firstSocketMiddlewareSpy).toHaveBeenCalledWith([firstEvent, data])

			expect(listenerFnSpy).toHaveBeenCalledTimes(1)
			expect(listenerFnSpy).toHaveBeenCalledWith(clientSocket.id, data)

			expect(secondListenerFnSpy).toHaveBeenCalledTimes(1)
			expect(secondListenerFnSpy).toHaveBeenCalledWith(clientSocket.id, data)

			expectCallOrder(firstSocketMiddlewareSpy, listenerFnSpy)
			expectCallOrder(firstSocketMiddlewareSpy, secondListenerFnSpy)
		})

		it("should call multiple middlewares before the controller when an event is emitted", (done) => {
			const event = "simpleEventWithManyMiddlewaresTest"
			const data: MessageData = { message: "Hello" }

			clientSocket.on("simpleEventWithManyMiddlewaresTestResp", () => {
				expect(firstSocketMiddlewareSpy).toHaveBeenCalledTimes(1)
				expect(firstSocketMiddlewareSpy).toHaveBeenCalledWith([event, data])

				expect(secondSocketMiddlewareSpy).toHaveBeenCalledTimes(1)
				expect(secondSocketMiddlewareSpy).toHaveBeenCalledWith([event, data])

				expect(listenerFnSpy).toHaveBeenCalledTimes(1)
				expect(listenerFnSpy).toHaveBeenCalledWith(clientSocket.id, data)

				expect(noListenerFnSpy).not.toHaveBeenCalled()

				expectCallOrder(firstSocketMiddlewareSpy, secondSocketMiddlewareSpy, listenerFnSpy)

				done()
			})

			clientSocket.emit(event, data)
		})

		it("should not call middleware on server listener", (done) => {
			const event = "serverListenerTest"

			clientSocket.on("serverListenerTestResp", () => {
				expect(connectionFnSpy).toHaveBeenCalledTimes(1)

				expect(serverListenerTestSocketMiddlewareSpy).toHaveBeenCalledTimes(1)
				expect(serverListenerTestSocketMiddlewareSpy).toHaveBeenCalledWith([event])

				done()
			})

			clientSocket.emit(event)
		})
	})

	describe("> Error handling tests", () => {
		it.each(["error", "nextError"])("should not call next middleware when an error was thrown in a previous middleware", async (errorType) => {
			const event = "errorEventTest"

			clientSocket.emit(event, errorType)

			await waitFor(50)

			expect(firstSocketMiddlewareSpy).toHaveBeenCalledTimes(1)
			expect(errorSocketMiddlewareSpy).toHaveBeenCalledTimes(1)

			expect(secondSocketMiddlewareSpy).not.toHaveBeenCalled()
			expect(listenerFnSpy).not.toHaveBeenCalled()

			if (errorType === "error") {
				expect(errorMiddlewareSpy).toHaveBeenCalledTimes(1)
				expect(errorMiddlewareSpy).toHaveBeenCalledWith(new Error("error thrown"))
			}
		})
	})
})