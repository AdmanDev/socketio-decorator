import { afterAll, afterEach, beforeAll, describe, expect, it, jest } from "@jest/globals"
import { CurrentSocket, ISocketMiddleware, SocketNamespace, SocketOn } from "../../../../../src"
import { Event, Server, Socket as ServerSocket } from "socket.io"
import ioClient, { Socket as ClientSocket } from "socket.io-client"
import { MiddlewareOption } from "../../../../../src/Decorators/Middlewares/MiddlewareOptionDecorator"
import { SiodDecoratorError } from "../../../../../src/Models/Errors/SiodDecoratorError"
import { port, createServer } from "../../../../utilities/serverUtils"
describe("> Socket Namespace Decorator", () => {
	let io: Server
	let clientSocket: ClientSocket = null as Any

	const orderMessageSpy = jest.fn()
	const userMessageSpy = jest.fn()
	const noNamespaceMessageSpy = jest.fn()

	const socketMiddlewareSpy = jest.fn()
	const noNamespaceSocketMiddlewareSpy = jest.fn()

	function createClientSocket (namespace: string) {
		return ioClient(`http://localhost:${port}/${namespace}`,
			{
				autoConnect: false,
			}
		)
	}

	@SocketNamespace("/orders")
	class OrderController {
		@SocketOn("message")
		public onMessage (@CurrentSocket() socket: ServerSocket) {
			orderMessageSpy(socket.id)
			socket.emit("message-resp")
		}
	}

	@SocketNamespace("/users")
	class UserController {
		@SocketOn("message")
		public onMessage (@CurrentSocket() socket: ServerSocket) {
			userMessageSpy(socket.id)
			socket.emit("message-resp")
		}
	}

	class NoNamespaceController {
		@SocketOn("message")
		public onMessage (@CurrentSocket() socket: ServerSocket) {
			noNamespaceMessageSpy(socket.id)
			socket.emit("message-resp")
		}
	}

	@MiddlewareOption({ namespace: "/orders" })
	class SocketMiddleware implements ISocketMiddleware {
		public use (socket: ServerSocket, events: Event, next: (err?: Any) => void): void {
			socketMiddlewareSpy(socket.id)
			next()
		}
	}

	class NoNamespaceSocketMiddleware implements ISocketMiddleware {
		public use (socket: ServerSocket, events: Event, next: (err?: Any) => void): void {
			noNamespaceSocketMiddlewareSpy(socket.id)
			next()
		}
	}

	beforeAll((done) => {
		io = createServer(
			{
				controllers: [
					OrderController,
					UserController,
					NoNamespaceController
				],
				socketMiddlewares: [SocketMiddleware, NoNamespaceSocketMiddleware]
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

	describe("> Functional Tests", () => {
		it("should handle message in the /orders namespace", (done) => {
			clientSocket = createClientSocket("orders")

			clientSocket.on("message-resp", () => {
				expect(orderMessageSpy).toHaveBeenCalledTimes(1)
				expect(orderMessageSpy).toHaveBeenCalledWith(clientSocket.id)
				expect(userMessageSpy).not.toHaveBeenCalled()
				expect(noNamespaceMessageSpy).not.toHaveBeenCalled()

				done()
			})

			clientSocket.on("connect", () => {
				clientSocket.emit("message")
			})

			clientSocket.connect()
		})

		it("should handle message in the /users namespace", (done) => {
			clientSocket = createClientSocket("users")

			clientSocket.on("message-resp", () => {
				expect(userMessageSpy).toHaveBeenCalledTimes(1)
				expect(userMessageSpy).toHaveBeenCalledWith(clientSocket.id)
				expect(orderMessageSpy).not.toHaveBeenCalled()
				expect(noNamespaceMessageSpy).not.toHaveBeenCalled()

				done()
			})

			clientSocket.on("connect", () => {
				clientSocket.emit("message")
			})

			clientSocket.connect()
		})

		it("should handle message in the default namespace", (done) => {
			clientSocket = createClientSocket("")

			clientSocket.on("message-resp", () => {
				expect(noNamespaceMessageSpy).toHaveBeenCalledTimes(1)
				expect(noNamespaceMessageSpy).toHaveBeenCalledWith(clientSocket.id)

				expect(noNamespaceSocketMiddlewareSpy).toHaveBeenCalledTimes(1)
				expect(noNamespaceSocketMiddlewareSpy).toHaveBeenCalledWith(clientSocket.id)

				expect(orderMessageSpy).not.toHaveBeenCalled()
				expect(userMessageSpy).not.toHaveBeenCalled()

				done()
			})

			clientSocket.on("connect", () => {
				clientSocket.emit("message")
			})

			clientSocket.connect()
		})

		it("should call socket middleware on /orders namespace", (done) => {
			clientSocket = createClientSocket("orders")

			clientSocket.on("message-resp", () => {
				expect(socketMiddlewareSpy).toHaveBeenCalledTimes(1)
				expect(socketMiddlewareSpy).toHaveBeenCalledWith(clientSocket.id)

				done()
			})

			clientSocket.on("connect", () => {
				clientSocket.emit("message")
			})

			clientSocket.connect()
		})

		it("should not call socket middleware on other namespace", (done) => {
			clientSocket = createClientSocket("users")

			clientSocket.on("message-resp", () => {
				expect(socketMiddlewareSpy).not.toHaveBeenCalled()
				done()
			})

			clientSocket.on("connect", () => {
				clientSocket.emit("message")
			})

			clientSocket.connect()
		})

		it("should not call no namespace socket middleware on custom namespace", (done) => {
			clientSocket = createClientSocket("users")

			clientSocket.on("message-resp", () => {
				expect(noNamespaceSocketMiddlewareSpy).not.toHaveBeenCalled()
				done()
			})

			clientSocket.on("connect", () => {
				clientSocket.emit("message")
			})

			clientSocket.connect()
		})
	})

	describe("> Error handling tests", () => {
		it("should throw error when namespace doesn't start with '/'", () => {
			expect(() => {
				@SocketNamespace("invalid")
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				class InvalidController {}
			}).toThrow(SiodDecoratorError)
		})

		it("should throw error with empty namespace string", () => {
			expect(() => {
				@SocketNamespace("")
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				class EmptyController {}
			}).toThrow(SiodDecoratorError)
		})
	})
})