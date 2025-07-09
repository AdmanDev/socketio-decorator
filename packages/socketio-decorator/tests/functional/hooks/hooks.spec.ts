import { afterEach, describe, expect, it, jest } from "@jest/globals"
import { Server, Socket as ServerSocket } from "socket.io"
import { Socket as ClientSocket } from "socket.io-client"
import { CurrentSocket, SocketOn, useIoServer, useUserSocket } from "../../../src"
import { createServer, createSocketClient } from "../../utilities/serverUtils"
import { waitFor } from "../../utilities/testUtils"

describe("> Hooks tests", () => {
	let io: Server
	let clientSocket: ClientSocket

	afterEach(() => {
		clientSocket?.disconnect()
		io?.close()
	})

	describe("> UseIoServer hook tests", () => {
		it("should get the socket.io server instance", (done) => {
			io = createServer(
				{
					controllers: [],
				},
				{
					onServerListen: () => onServerListen()
				}
			)

			const onServerListen = () => {
				const ioServer = useIoServer()

				expect(ioServer).toBe(io)
				done()
			}
		})
	})

	describe("> useUserSocket hook tests", () => {
		it("should get the socket instance from a user", (done) => {
			const controllerFnSpy = jest.fn()

			class TestHookController {
				@SocketOn("get-user-socket")
				public async getUserSocket (@CurrentSocket() socket: ServerSocket) {
					const userSocket = await useUserSocket(socket.id)
					controllerFnSpy(userSocket?.id)
				}
			}

			io = createServer(
				{
					controllers: [TestHookController],
					searchUserSocket: async (userId: string) => Promise.resolve(io.sockets.sockets.get(userId) || null)
				},
				{
					onServerListen: () => {
						clientSocket = createSocketClient(onSocketConnect)
					}
				}
			)

			const onSocketConnect = async () => {
				clientSocket.emit("get-user-socket")

				await waitFor(50)

				expect(controllerFnSpy).toHaveBeenCalledTimes(1)
				expect(controllerFnSpy).toHaveBeenCalledWith(clientSocket.id)

				done()
			}
		})

		it("should get null if the searchUserSocket function isn't defined", (done) => {
			const controllerFnSpy = jest.fn()

			class TestHookController {
				@SocketOn("get-user-socket")
				public async getUserSocket (@CurrentSocket() socket: ServerSocket) {
					const userSocket = await useUserSocket(socket.id)
					controllerFnSpy(userSocket)
				}
			}

			io = createServer(
				{
					controllers: [TestHookController],
				},
				{
					onServerListen: () => {
						clientSocket = createSocketClient(onSocketConnect)
					}
				}
			)

			const onSocketConnect = async () => {
				clientSocket.emit("get-user-socket")

				await waitFor(50)

				expect(controllerFnSpy).toHaveBeenCalledTimes(1)
				expect(controllerFnSpy).toHaveBeenCalledWith(null)

				done()
			}
		})
	})

})