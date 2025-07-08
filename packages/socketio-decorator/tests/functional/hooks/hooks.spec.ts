import { afterEach, describe, expect, it, jest } from "@jest/globals"
import { Server, Socket as ServerSocket } from "socket.io"
import { Socket as ClientSocket } from "socket.io-client"
import { CurrentSocket, SocketEmitter, SocketOn, useCurrentUser, useIoServer, useUserSocket } from "../../../src"
import { createSocketClient, createServer } from "../../utilities/serverUtils"
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

	describe("> useCurrentUser hook tests", () => {
		it("should get the current user from the socket instance", (done) => {
			class TestHookController {
				@SocketOn("get-current-user")
				@SocketEmitter("current-user-resp")
				public async getCurrentUser (@CurrentSocket() socket: ServerSocket) {
					return await useCurrentUser(socket)
				}
			}

			io = createServer(
				{
					controllers: [TestHookController],
					currentUserProvider: (socket) => Promise.resolve({ id: socket.id })
				},
				{
					onServerListen: () => {
						clientSocket = createSocketClient(onSocketConnect)
					}
				}
			)

			const onSocketConnect = () => {
				clientSocket.on("current-user-resp", (user) => {
					expect(user).toEqual({ id: clientSocket.id })
					done()
				})

				clientSocket.emit("get-current-user")
			}
		})

		it("should get null if the current user provider isn't defined", (done) => {
			class TestHookController {
				@SocketOn("get-current-user")
				@SocketEmitter("current-user-resp")
				public async getCurrentUser (socket: ServerSocket) {
					const user = await useCurrentUser(socket)
					return { user }
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

			const onSocketConnect = () => {
				clientSocket.on("current-user-resp", (user) => {
					expect(user).toEqual({ user: null })
					done()
				})

				clientSocket.emit("get-current-user")
			}
		})
	})

	describe("> useUserSocket hook tests", () => {
		it("should get the socket instance from a user", (done) => {
			const controllerFnSpy = jest.fn()

			class TestHookController {
				@SocketOn("get-user-socket")
				public getUserSocket (@CurrentSocket() socket: ServerSocket) {
					controllerFnSpy(useUserSocket(socket.id)?.id)
				}
			}

			io = createServer(
				{
					controllers: [TestHookController],
					searchUserSocket: (userId: string) => io.sockets.sockets.get(userId)
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

		it("should get undefined if the searchUserSocket function isn't defined", (done) => {
			const controllerFnSpy = jest.fn()

			class TestHookController {
				@SocketOn("get-user-socket")
				public getUserSocket (@CurrentSocket() socket: ServerSocket) {
					controllerFnSpy(useUserSocket(socket.id)?.id)
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
				expect(controllerFnSpy).toHaveBeenCalledWith(undefined)

				done()
			}
		})
	})

})