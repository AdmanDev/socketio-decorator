import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, jest } from "@jest/globals"
import { Server, Socket as ServerSocket } from "socket.io"
import { Socket as ClientSocket } from "socket.io-client"
import { OnRoomLeft } from "../../../../../src"
import { createServer, createSocketClient } from "../../../../utilities/serverUtils"
import { waitFor } from "../../../../utilities/testUtils"

describe("> OnRoomLeft decorator", () => {
	let io: Server
	let serverSocket: ServerSocket
	let clientSocket: ClientSocket

	const allRoomsSpy = jest.fn()
	const specificRoomSpy = jest.fn()

	class OnRoomLeftEvents {
		@OnRoomLeft()
		public onAnyRoomLeft (roomName: string, socket: ServerSocket) {
			allRoomsSpy(roomName, socket.id)
		}

		@OnRoomLeft("vip-room")
		public onVipRoomLeft (roomName: string, socket: ServerSocket) {
			specificRoomSpy(roomName, socket.id)
		}
	}

	beforeAll((done) => {
		io = createServer(
			{
				roomEventListeners: [OnRoomLeftEvents],
				controllers: []
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
		it("should trigger handler when a socket leaves any room (no room filter)", async () => {
			const roomName = "test-room"

			serverSocket.join(roomName)
			serverSocket.leave(roomName)

			await waitFor(50)

			expect(allRoomsSpy).toHaveBeenCalledWith(roomName, serverSocket.id)
		})

		it("should trigger handler only for the specified room", async () => {
			const vipRoom = "vip-room"
			const regularRoom = "regular-room"

			serverSocket.join(vipRoom)
			serverSocket.join(regularRoom)

			serverSocket.leave(vipRoom)
			serverSocket.leave(regularRoom)

			await waitFor(50)

			expect(specificRoomSpy).toHaveBeenNthCalledWith(1, vipRoom, serverSocket.id)
			expect(specificRoomSpy).not.toHaveBeenCalledWith(regularRoom, serverSocket.id)
		})

		it("should trigger both handlers when leaving a room (all rooms + specific)", async () => {
			const vipRoom = "vip-room"

			serverSocket.join(vipRoom)
			serverSocket.leave(vipRoom)

			await waitFor(50)

			expect(allRoomsSpy).toHaveBeenNthCalledWith(1, vipRoom, serverSocket.id)
			expect(specificRoomSpy).toHaveBeenNthCalledWith(1, vipRoom, serverSocket.id)
		})

		it("should trigger for multiple room leaves", async () => {
			const room1 = "room-1"
			const room2 = "room-2"
			const room3 = "room-3"

			serverSocket.join(room1)
			serverSocket.join(room2)
			serverSocket.join(room3)

			serverSocket.leave(room1)
			serverSocket.leave(room2)
			serverSocket.leave(room3)

			await waitFor(50)

			expect(allRoomsSpy).toHaveBeenCalledTimes(3)
			expect(allRoomsSpy).toHaveBeenNthCalledWith(1, room1, serverSocket.id)
			expect(allRoomsSpy).toHaveBeenNthCalledWith(2, room2, serverSocket.id)
			expect(allRoomsSpy).toHaveBeenNthCalledWith(3, room3, serverSocket.id)
		})

		it("should not trigger if the socket id is the same as the room", async () => {
			clientSocket.disconnect()

			await waitFor(50)

			expect(allRoomsSpy).not.toHaveBeenCalledWith(serverSocket.id, serverSocket.id)
		})
	})
})