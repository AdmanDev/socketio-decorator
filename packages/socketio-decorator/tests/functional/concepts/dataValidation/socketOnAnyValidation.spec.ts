import { afterAll, beforeAll, describe, expect, it, jest } from "@jest/globals"
import { Server, Socket as ServerSocket } from "socket.io"
import { CurrentSocket, Data, EventName, IErrorMiddleware, SiodImcomigDataError, SocketOnAny } from "../../../../src"
import { MessageData } from "../../../types/socketData"
import { createSocketClient, createServer, registerServerEventAndEmit } from "../../../utilities/serverUtils"

describe("> @SocketOnAny Data Validation", () => {
	describe("> should NOT validate by default", () => {
		let io: Server
		let serverSocket: ServerSocket

		const socketOnAnySpy = jest.fn()
		const socketOnAnyErrorSpy = jest.fn()

		class SocketOnAnyErrorMiddleware implements IErrorMiddleware {
			public handleError (error: unknown) {
				socketOnAnyErrorSpy(error)
			}
		}

		class SocketOnAnyNoValidationController {
			@SocketOnAny()
			public onAny (@CurrentSocket() socket: ServerSocket, @EventName() event: string, @Data() data: MessageData) {
				socketOnAnySpy(data, socket.id, event)
			}
		}

		beforeAll((done) => {
			io = createServer(
				{
					controllers: [SocketOnAnyNoValidationController],
					errorMiddleware: SocketOnAnyErrorMiddleware,
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

		afterAll(() => {
			io.close()
		})

		it("should NOT validate when option is not set", (done) => {
			const clientSocket = createSocketClient(() => {
				const event = "any-event"
				const data = { wrong: "data" }

				const onNoValidation = () => {
					expect(socketOnAnyErrorSpy).not.toHaveBeenCalled()
					expect(socketOnAnySpy).toHaveBeenCalledTimes(1)
					expect(socketOnAnySpy).toHaveBeenCalledWith(data, expect.any(String), event)

					clientSocket.disconnect()
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
	})

	describe("> should validate when disableDataValidation: false", () => {
		let io: Server
		let serverSocket: ServerSocket

		const socketOnAnySpy = jest.fn()
		const socketOnAnyErrorSpy = jest.fn()

		class SocketOnAnyErrorMiddleware implements IErrorMiddleware {
			public handleError (error: unknown) {
				socketOnAnyErrorSpy(error)
			}
		}

		class SocketOnAnyWithValidationController {
			@SocketOnAny({ disableDataValidation: false })
			public onAny (@CurrentSocket() socket: ServerSocket, @EventName() event: string, @Data() data: MessageData) {
				socketOnAnySpy(socket.id, event, data)
			}
		}

		beforeAll((done) => {
			io = createServer(
				{
					controllers: [SocketOnAnyWithValidationController],
					errorMiddleware: SocketOnAnyErrorMiddleware,
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

		afterAll(() => {
			io.close()
		})

		it("should validate when explicitly enabled", (done) => {
			const clientSocket = createSocketClient(() => {
				const event = "any-event"
				const data = { wrong: "data" }

				const onMessage = () => {
					expect(socketOnAnySpy).not.toHaveBeenCalled()
					expect(socketOnAnyErrorSpy).toHaveBeenCalledTimes(1)
					expect(socketOnAnyErrorSpy).toHaveBeenCalledWith(expect.any(SiodImcomigDataError))

					clientSocket.disconnect()
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
		})
	})
})
