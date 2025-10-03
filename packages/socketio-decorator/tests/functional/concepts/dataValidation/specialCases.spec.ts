import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, jest } from "@jest/globals"
import { Server, Socket as ServerSocket } from "socket.io"
import { Socket as ClientSocket } from "socket.io-client"
import { CurrentSocket, Data, EventName, IErrorMiddleware, SocketOn, SocketOnAnyOutgoing } from "../../../../src"
import { MessageData } from "../../../types/socketData"
import { createSocketClient, createServer } from "../../../utilities/serverUtils"
import { waitFor } from "../../../utilities/testUtils"
import { IoCContainer } from "../../../../src/IoCContainer"

describe("> Data Validation Special Cases", () => {
	describe("> Disconnect/Disconnecting events", () => {
		let io: Server
		let serverSocket: ServerSocket
		let clientSocket: ClientSocket

		const disconnectSpy = jest.fn()
		const errorMiddlewareSpy = jest.fn()

		class ErrorMiddleware implements IErrorMiddleware {
			public handleError (error: unknown) {
				errorMiddlewareSpy(error)
			}
		}

		class DisconnectController {
			@SocketOn("disconnecting")
			public onDisconnecting (@CurrentSocket() socket: ServerSocket, @Data() wrongData: MessageData) {
				disconnectSpy(wrongData)
			}

			@SocketOn("disconnect")
			public onDisconnect (@Data() wrongData: MessageData) {
				disconnectSpy(wrongData)
			}
		}

		beforeAll((done) => {
			io = createServer(
				{
					controllers: [DisconnectController],
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
			if (clientSocket?.connected) {
				clientSocket.disconnect()
			}
		})

		afterAll(() => {
			io.close()
		})

		it("should NOT validate on disconnect/disconnecting events", (done) => {
			disconnectSpy.mockClear()

			serverSocket.on("disconnect", async () => {
				await waitFor(50)
				expect(errorMiddlewareSpy).not.toHaveBeenCalled()
				expect(disconnectSpy).toHaveBeenCalled()

				done()
			})

			clientSocket.disconnect()
		})
	})

	describe("> @SocketOnAnyOutgoing (never validates)", () => {
		let io: Server
		let serverSocket: ServerSocket
		let clientSocket: ClientSocket

		const onAnyOutgoingSpy = jest.fn()
		const errorMiddlewareSpy = jest.fn()

		class ErrorMiddleware implements IErrorMiddleware {
			public handleError (error: unknown) {
				errorMiddlewareSpy(error)
			}
		}

		class SocketOnAnyOutgoingController {
			@SocketOnAnyOutgoing()
			public onAnyOutgoing (@CurrentSocket() socket: ServerSocket, @EventName() event: string, @Data() data: unknown) {
				onAnyOutgoingSpy(socket.id, event, data)
			}

			public sendMessage (data: MessageData) {
				io.emit("test-outgoing", data)
			}
		}

		beforeAll((done) => {
			io = createServer(
				{
					controllers: [SocketOnAnyOutgoingController],
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

		it("should NEVER validate data", async () => {
			const data = { wrong: "data" }

			const controller = IoCContainer.getInstance<SocketOnAnyOutgoingController>(SocketOnAnyOutgoingController)

			controller.sendMessage(data as Any)

			await waitFor(50)

			expect(errorMiddlewareSpy).not.toHaveBeenCalled()
			expect(onAnyOutgoingSpy).toHaveBeenCalledTimes(1)
			expect(onAnyOutgoingSpy).toHaveBeenCalledWith(serverSocket.id, "test-outgoing", data)
		})
	})
})
