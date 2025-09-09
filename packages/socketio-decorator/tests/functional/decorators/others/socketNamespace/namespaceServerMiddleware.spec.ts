import { afterAll, afterEach, beforeAll, describe, expect, it, jest } from "@jest/globals"
import { Server, Socket as ServerSocket } from "socket.io"
import ioClient, { Socket as ClientSocket } from "socket.io-client"
import { SocketNamespace, SocketOn, CurrentSocket, IServerMiddleware } from "../../../../../src"
import { createServer, port } from "../../../../utilities/serverUtils"
import { MiddlewareOption } from "../../../../../src/Decorators/Middlewares/MiddlewareOptionDecorator"

describe("> Namespace Socket Middleware", () => {
	let io: Server
	const clientSocket: ClientSocket = null as Any

	const orderMiddlewareSpy = jest.fn()
	const userMiddlewareSpy = jest.fn()
	const noNamespaceMiddlewareSpy = jest.fn()

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
			socket.emit("message-resp")
		}
	}

	class DefaultController {
		@SocketOn("message")
		public onMessage (@CurrentSocket() socket: ServerSocket) {
			socket.emit("message-resp")
		}
	}

	@MiddlewareOption({ namespace: "/orders" })
	class OrderMiddleware implements IServerMiddleware {
		public use (socket: ServerSocket, next: (err?: Any) => void): void {
			orderMiddlewareSpy(socket.id)
			next()
		}
	}

	@MiddlewareOption({ namespace: "/users" })
	class UserMiddleware implements IServerMiddleware {
		public use (socket: ServerSocket, next: (err?: Any) => void): void {
			userMiddlewareSpy()
			next()
		}
	}

	class NoNamespaceMiddleware implements IServerMiddleware {
		public use (socket: ServerSocket, next: (err?: Any) => void): void {
			noNamespaceMiddlewareSpy(socket.id)
			next()
		}
	}

	beforeAll((done) => {
		io = createServer(
			{
				controllers: [
					OrderController,
					DefaultController
				],
				serverMiddlewares: [
					OrderMiddleware,
					UserMiddleware,
					NoNamespaceMiddleware,
				]
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

	describe("> Funcional tests", () => {
		it("should call OrderMiddleware when connecting to /orders namespace", (done) => {
			const clientSocket = createClientSocket("orders")

			clientSocket.on("message-resp", () => {
				expect(orderMiddlewareSpy).toHaveBeenCalledTimes(1)
				expect(orderMiddlewareSpy).toHaveBeenCalledWith(clientSocket.id)

				done()
			})

			clientSocket.on("connect", () => {
				clientSocket.emit("message")
			})

			clientSocket.connect()
		})

		it("should not call other middlewares when connecting to /orders namespace", (done) => {
			const clientSocket = createClientSocket("orders")

			clientSocket.on("message-resp", () => {
				expect(userMiddlewareSpy).not.toHaveBeenCalled()
				expect(noNamespaceMiddlewareSpy).not.toHaveBeenCalled()

				done()
			})

			clientSocket.on("connect", () => {
				clientSocket.emit("message")
			})

			clientSocket.connect()
		})

		it("should call NoNamespaceMiddleware when connecting to default namespace", (done) => {
			const clientSocket = createClientSocket("")

			clientSocket.on("message-resp", () => {
				expect(noNamespaceMiddlewareSpy).toHaveBeenCalledTimes(1)
				expect(noNamespaceMiddlewareSpy).toHaveBeenCalledWith(clientSocket.id)

				expect(orderMiddlewareSpy).not.toHaveBeenCalled()
				expect(userMiddlewareSpy).not.toHaveBeenCalled()

				done()
			})

			clientSocket.on("connect", () => {
				clientSocket.emit("message")
			})

			clientSocket.connect()

		})
	})
})