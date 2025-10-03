import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, jest } from "@jest/globals"
import { Server, Socket as ServerSocket } from "socket.io"
import { Socket as ClientSocket } from "socket.io-client"
import { CurrentSocket, Data, IErrorMiddleware, SiodImcomigDataError, SocketOn } from "../../../../src"
import { MessageData } from "../../../types/socketData"
import { createSocketClient, createServer, registerServerEventAndEmit } from "../../../utilities/serverUtils"

describe("> @SocketOn Data Validation", () => {
	let io: Server
	let serverSocket: ServerSocket
	let clientSocket: ClientSocket

	const controllerFnSpy = jest.fn()
	const errorMiddlewareSpy = jest.fn()

	class ErrorMiddleware implements IErrorMiddleware {
		public handleError (error: unknown) {
			errorMiddlewareSpy(error)
		}
	}

	class SocketOnValidationController {
		@SocketOn("with-validation")
		public onWithValidation (@CurrentSocket() socket: ServerSocket, @Data() data: MessageData) {
			controllerFnSpy(data, socket.id)
		}

		@SocketOn("no-validation", { disableDataValidation: true })
		public onNoValidation (@CurrentSocket() socket: ServerSocket, @Data() data: MessageData) {
			controllerFnSpy(data, socket.id)
		}
	}

	beforeAll((done) => {
		io = createServer(
			{
				controllers: [SocketOnValidationController],
				errorMiddleware: ErrorMiddleware,
				dataValidationEnabled: true
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
		clientSocket = createSocketClient(done)
	})

	afterEach(() => {
		clientSocket.disconnect()
	})

	afterAll(() => {
		io.close()
	})

	it("should validate data by default", (done) => {
		const event = "with-validation"
		const data = { wrong: "data" }

		const onMessage = () => {
			expect(controllerFnSpy).not.toHaveBeenCalled()
			expect(errorMiddlewareSpy).toHaveBeenCalledTimes(1)
			expect(errorMiddlewareSpy).toHaveBeenCalledWith(expect.any(SiodImcomigDataError))

			done()
		}

		registerServerEventAndEmit({
			eventCallback: onMessage,
			event,
			data,
			serverSocket,
			clientSocket
		})
	})

	it("should skip validation when disableDataValidation: true", (done) => {
		const event = "no-validation"
		const data = { wrong: "data" }

		const onNoValidation = () => {
			expect(errorMiddlewareSpy).not.toHaveBeenCalled()
			expect(controllerFnSpy).toHaveBeenCalledTimes(1)
			expect(controllerFnSpy).toHaveBeenCalledWith(data, expect.any(String))

			done()
		}

		registerServerEventAndEmit({
			eventCallback: onNoValidation,
			event,
			data,
			serverSocket,
			clientSocket
		})
	})
})
