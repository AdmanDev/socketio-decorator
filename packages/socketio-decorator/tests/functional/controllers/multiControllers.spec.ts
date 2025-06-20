import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, jest } from "@jest/globals"
import { Server, Socket as ServerSocket } from "socket.io"
import { Socket as ClientSocket } from "socket.io-client"
import { CurrentSocket, IErrorMiddleware, SocketEmitter, SocketOn } from "../../../src"
import { createSocketClient, createServer } from "../../utilities/serverUtils"
import { waitFor } from "../../utilities/testUtils"

describe("> Multi controller tests", () => {
	let io: Server
	let clientSocket: ClientSocket

	const errorMiddlewareSpy = jest.fn()
	const firstControllerFnSpy = jest.fn()
	const secondControllerFnSpy = jest.fn()
	const notUsedControllerFnSpy = jest.fn()

	class ErrorMiddleware implements IErrorMiddleware {
		public handleError (error: Error, socket?: ServerSocket) {
			errorMiddlewareSpy(error, socket?.id)
		}
	}

	class FirstController {
		private readonly name = "controller 1"

		@SocketOn("message")
		@SocketEmitter("c1MessageResp")
		public onMessage (@CurrentSocket() socket: ServerSocket) {
			firstControllerFnSpy(socket.id)
			return `Hello from ${this.name}`
		}

		@SocketOn("c1Action")
		@SocketEmitter("c1ActionResp")
		public c1Action (@CurrentSocket() socket: ServerSocket) {
			firstControllerFnSpy(socket.id)
			return `Action from ${this.name}`
		}
	}

	class SecondController {
		private readonly name = "controller 2"

		@SocketOn("message")
		@SocketEmitter("c2MessageResp")
		public onMessage (@CurrentSocket() socket: ServerSocket) {
			secondControllerFnSpy(socket.id)
			return `Hello from ${this.name}`
		}

		@SocketOn("c2Action")
		@SocketEmitter("c2ActionResp")
		public c2Action (@CurrentSocket() socket: ServerSocket) {
			secondControllerFnSpy(socket.id)
			return `Action from ${this.name}`
		}
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	class NotRegisteredController {
		@SocketOn("message")
		public onMessage (@CurrentSocket() socket: ServerSocket) {
			notUsedControllerFnSpy(socket.id)
		}
	}

	const c1OnMessageMock = jest.spyOn(FirstController.prototype, "onMessage")

	beforeAll((done) => {
		io = createServer(
			{
				controllers: [FirstController, SecondController],
				errorMiddleware: ErrorMiddleware,
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
		it("should receive only a 'c1ActionResp' event from controller 1", (done) => {
			const event = "c1Action"

			clientSocket.on("c1ActionResp", (data) => {
				expect(errorMiddlewareSpy).not.toHaveBeenCalled()

				expect(data).toBe("Action from controller 1")
				expect(secondControllerFnSpy).not.toHaveBeenCalled()

				expect(firstControllerFnSpy).toHaveBeenCalledTimes(1)
				expect(firstControllerFnSpy).toHaveBeenCalledWith(clientSocket.id)

				done()
			})

			clientSocket.emit(event)
		})

		it("should receive only a 'c2ActionResp' event from controller 2", (done) => {
			const event = "c2Action"

			clientSocket.on("c2ActionResp", (data) => {
				expect(errorMiddlewareSpy).not.toHaveBeenCalled()

				expect(data).toBe("Action from controller 2")
				expect(firstControllerFnSpy).not.toHaveBeenCalled()

				expect(secondControllerFnSpy).toHaveBeenCalledTimes(1)
				expect(secondControllerFnSpy).toHaveBeenCalledWith(clientSocket.id)

				done()
			})

			clientSocket.emit(event)
		})

		it("should receive message from both controllers from the same event", async () => {
			const event = "message"

			const c1MsgRespSpy = jest.fn()
			const c2MsgRespSpy = jest.fn()

			clientSocket.on("c1MessageResp", c1MsgRespSpy)
			clientSocket.on("c2MessageResp", c2MsgRespSpy)

			clientSocket.emit(event)

			await waitFor(50)

			expect(errorMiddlewareSpy).not.toHaveBeenCalled()

			expect(c1MsgRespSpy).toHaveBeenCalledTimes(1)
			expect(c1MsgRespSpy).toHaveBeenCalledWith("Hello from controller 1")

			expect(c2MsgRespSpy).toHaveBeenCalledTimes(1)
			expect(c2MsgRespSpy).toHaveBeenCalledWith("Hello from controller 2")

			expect(firstControllerFnSpy.mock.invocationCallOrder[0]).toBeLessThan(secondControllerFnSpy.mock.invocationCallOrder[0])
		})

		it("should not trigger events from not registered controllers", async () => {
			const event = "message"

			clientSocket.emit(event)
			await waitFor(50)

			expect(notUsedControllerFnSpy).not.toHaveBeenCalled()
		})
	})

	describe("> Error handling tests", () => {
		it("should call the error middleware when an error is raised in one controller", async () => {
			const expectedError = new Error("one controller Error")

			c1OnMessageMock.mockImplementationOnce(() => {
				throw expectedError
			})

			clientSocket.emit("message")

			await waitFor(50)

			expect(errorMiddlewareSpy).toHaveBeenCalledTimes(1)
			expect(errorMiddlewareSpy).toHaveBeenCalledWith(expectedError, clientSocket.id)

			expect(secondControllerFnSpy).toHaveBeenCalledTimes(1)
		})

	})
})