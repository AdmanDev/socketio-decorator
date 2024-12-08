import { afterAll, afterEach, beforeAll, describe, expect, it, jest } from "@jest/globals"
import { IErrorMiddleware, IServerMiddleware, ServerOn, SocketEmitter } from "../../../../src"
import { Server, Socket as ServerSocket } from "socket.io"
import { Socket as ClientSocket } from "socket.io-client"
import { createSocketClient as createSocketClient, createServer } from "../../../utilities/serverUtils"

describe("> Multi ServerMiddleware decorator", () => {
	let io: Server
	let clientSocket: ClientSocket

	const controllerFnSpy = jest.fn()
	const errorMiddlewareSpy = jest.fn()
	const firstServerMiddlewareSpy = jest.fn()
	const secondServerMiddlewareSpy = jest.fn()

	class ErrorMiddleware implements IErrorMiddleware {
		public handleError (error: unknown, socket?: ServerSocket) {
			errorMiddlewareSpy(error, socket?.id)
		}
	}

	class TestController {
		@ServerOn("connection")
		@SocketEmitter("connectionResp")
		public onConnection (socket: ServerSocket) {
			controllerFnSpy(socket.id)
			return 1
		}
	}

	class FirstServerMiddleware implements IServerMiddleware {
		use (socket: ServerSocket, next: (err?: unknown) => void) {
			firstServerMiddlewareSpy(socket.id)
			next()
		}
	}

	class SecondServerMiddleware implements IServerMiddleware {
		use (socket: ServerSocket, next: (err?: unknown) => void) {
			secondServerMiddlewareSpy(socket.id)
			next()
		}
	}

	beforeAll((done) => {
		io = createServer(
			{
				controllers: [TestController],
				errorMiddleware: ErrorMiddleware,
				serverMiddlewares: [FirstServerMiddleware, SecondServerMiddleware],
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
		it("should call both first and second server middlewares in order", (done) => {
			clientSocket = createSocketClient(undefined, false)

			clientSocket.on("connectionResp", () => {
				expect(errorMiddlewareSpy).not.toHaveBeenCalled()
				expect(controllerFnSpy).toHaveBeenCalledTimes(1)

				expect(firstServerMiddlewareSpy).toHaveBeenCalledTimes(1)
				expect(firstServerMiddlewareSpy).toHaveBeenCalledWith(clientSocket.id)

				expect(secondServerMiddlewareSpy).toHaveBeenCalledTimes(1)
				expect(secondServerMiddlewareSpy).toHaveBeenCalledWith(clientSocket.id)

				expect(firstServerMiddlewareSpy.mock.invocationCallOrder[0]).toBeLessThan(secondServerMiddlewareSpy.mock.invocationCallOrder[0])
				expect(secondServerMiddlewareSpy.mock.invocationCallOrder[0]).toBeLessThan(controllerFnSpy.mock.invocationCallOrder[0])

				done()
			})

			clientSocket.connect()
		})
	})
})