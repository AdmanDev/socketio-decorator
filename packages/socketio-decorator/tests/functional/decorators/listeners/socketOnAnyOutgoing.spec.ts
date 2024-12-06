import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, jest } from "@jest/globals"
import { Server, Socket as ServerSocket } from "socket.io"
import { Socket as ClientSocket } from "socket.io-client"
import { IErrorMiddleware, SocketOnAnyOutgoing } from "../../../../src"
import { MessageData } from "../../../types/socketData"
import { createClientSocket, createServer } from "../../../utilities/serverUtils"
import { getInstance } from "../../../../src/container"

describe("> SocketOn decorator", () => {
	let io: Server
	let serverSocket: ServerSocket
	let clientSocket: ClientSocket

	const errorMiddlewareCallback = jest.fn()
	const socketOnAnyOutgoingSpy = jest.fn()

	const testEventName = "testEvent"

	class ErrorMiddleware implements IErrorMiddleware {
		public handleError (error: unknown) {
			errorMiddlewareCallback(error)
		}
	}

	class SocketOnAnyOutgoingController {
		public sendMessage (data: MessageData) {
			io.emit(testEventName, data)
		}

		@SocketOnAnyOutgoing()
		public onMessage (socket: ServerSocket, event: string, data: unknown) {
			socketOnAnyOutgoingSpy(socket.id, event, data)
		}
	}

	beforeAll((done) => {
		io = createServer(
			{
				controllers: [SocketOnAnyOutgoingController],
				errorMiddleware: ErrorMiddleware,
			},
			{
				onServerListen: done,
				onServerSocketConnection: (socket) => {
					serverSocket = socket
				}
			}
		)
	})

	beforeEach((done) => {
		clientSocket = createClientSocket(done)
	})

	afterEach(() => {
		clientSocket.disconnect()
	})

	afterAll(() => {
		io.close()
	})

	describe("> Functional tests", () => {
		it("should register a listener for any outgoing event and dispatch the data to the controller", () => {
			const data: MessageData = { message: "Hello ma'am" }

			const controller = getInstance<SocketOnAnyOutgoingController>(SocketOnAnyOutgoingController)

			controller.sendMessage(data)

			expect(errorMiddlewareCallback).not.toHaveBeenCalled()
			expect(socketOnAnyOutgoingSpy).toHaveBeenCalledTimes(1)
			expect(socketOnAnyOutgoingSpy).toHaveBeenCalledWith(serverSocket.id, testEventName, data)
		})
	})

	describe("> Data validation tests", () => {
		it("should not throw an error if the data is not valid", () => {
			const data = { wrong: "data" }

			const controller = getInstance<SocketOnAnyOutgoingController>(SocketOnAnyOutgoingController)

			controller.sendMessage(data as Any)

			expect(errorMiddlewareCallback).not.toHaveBeenCalled()
			expect(socketOnAnyOutgoingSpy).toHaveBeenCalledTimes(1)
			expect(socketOnAnyOutgoingSpy).toHaveBeenCalledWith(serverSocket.id, testEventName, data)
		})
	})
})