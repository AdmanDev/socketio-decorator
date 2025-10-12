import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, jest } from "@jest/globals"
import { Server, Socket as ServerSocket } from "socket.io"
import { Socket as ClientSocket } from "socket.io-client"
import { AutoJoinRoom, IErrorMiddleware, SocketOn } from "../../../../src"
import { createServer, createSocketClient } from "../../../utilities/serverUtils"
import { waitFor } from "../../../utilities/testUtils"

describe("> AutoJoinRoom Decorator Tests", () => {
	let io: Server
	let serverSocket: ServerSocket
	let clientSocket: ClientSocket

	const errorMiddlewareSpy = jest.fn()

	type CreateGameData = {
		roomName: string
	}

	class ErrorMiddleware implements IErrorMiddleware {
		public handleError (error: unknown, socket?: ServerSocket) {
			errorMiddlewareSpy(error, socket?.id)
		}
	}

	class GameController {
		@SocketOn("create-game")
		@AutoJoinRoom("game-1")
		public onCreateGame () {
			// Do nothing
		}

		@SocketOn("create-game-dynamic")
		@AutoJoinRoom(({ data }: { data: CreateGameData }) => data.roomName)
		public onCreateGameDynamic () {
			// Do nothing
		}

		@SocketOn("create-multiple-games")
		@AutoJoinRoom("game-1")
		@AutoJoinRoom("game-2")
		public onCreateMultipleGames () {
			// Do nothing
		}

		@SocketOn("create-game-error")
		@AutoJoinRoom("game-1")
		public onCreateGameError () {
			throw new Error("test error")
		}
	}

	beforeAll((done) => {
		io = createServer(
			{
				controllers: [GameController],
				errorMiddleware: ErrorMiddleware
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

	describe("> Functional tests", () => {
		it("should auto join the room", async () => {
			clientSocket.emit("create-game")

			await waitFor(50)

			const hasJoinedRoom = serverSocket.rooms.has("game-1")

			expect(hasJoinedRoom).toBe(true)
		})

		it("should auto join the room using the dynamic room name getter", async () => {
			const roomName = "room-name-from-client"

			clientSocket.emit("create-game-dynamic", {roomName})

			await waitFor(50)

			const hasJoinedRoom = serverSocket.rooms.has(roomName)

			expect(hasJoinedRoom).toBe(true)
		})

		it("should auto join multiple rooms", async () => {
			clientSocket.emit("create-multiple-games")

			await waitFor(50)

			const hasJoinedRoom = serverSocket.rooms.has("game-1")
			const hasJoinedRoom2 = serverSocket.rooms.has("game-2")

			expect(hasJoinedRoom).toBe(true)
			expect(hasJoinedRoom2).toBe(true)
		})

		it("should not join the room when the controller throws an error", async () => {
			clientSocket.emit("create-game-error")

			await waitFor(50)

			const hasJoinedRoom = serverSocket.rooms.has("game-1")

			expect(hasJoinedRoom).toBe(false)
			expect(errorMiddlewareSpy).toHaveBeenCalledTimes(1)
		})
	})

})