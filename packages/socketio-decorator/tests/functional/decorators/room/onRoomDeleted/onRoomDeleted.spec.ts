import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, jest } from "@jest/globals"
import { Server, Socket as ServerSocket } from "socket.io"
import { Socket as ClientSocket } from "socket.io-client"
import { OnRoomDeleted } from "../../../../../src"
import { createServer, createSocketClient } from "../../../../utilities/serverUtils"
import { waitFor } from "../../../../utilities/testUtils"

describe("> OnRoomDeleted decorator", () => {
	let io: Server
	let serverSocket: ServerSocket
	let clientSocket: ClientSocket

	const allRoomsSpy = jest.fn()
	const vipRoomDeletionSpy = jest.fn()

	class OnRoomDeletedEvents {
		@OnRoomDeleted()
		public onAnyRoomDeleted (roomName: string) {
			allRoomsSpy(roomName)
		}

		@OnRoomDeleted("vip-room")
		public onVipRoomDeleted (roomName: string) {
			vipRoomDeletionSpy(roomName)
		}
	}

	beforeAll((done) => {
		io = createServer(
			{
				roomEventListeners: [OnRoomDeletedEvents],
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

	afterEach(async () => {
		io.sockets.adapter.rooms.clear()
		clientSocket.disconnect()
	})

	afterAll(() => {
		io.close()
	})

	describe("> Functional tests", () => {
		it("should trigger handler when any room is deleted (no room filter)", async () => {
			const roomName = "test-room"

			serverSocket.join(roomName)
			serverSocket.leave(roomName)

			await waitFor(50)

			expect(allRoomsSpy).toHaveBeenNthCalledWith(1, roomName)
		})

		it("should trigger handler only for the specified room", async () => {
			const vipRoom = "vip-room"
			const regularRoom = "regular-room"

			serverSocket.join(vipRoom)
			serverSocket.join(regularRoom)

			serverSocket.leave(vipRoom)
			serverSocket.leave(regularRoom)

			await waitFor(50)

			expect(vipRoomDeletionSpy).toHaveBeenNthCalledWith(1, vipRoom)
			expect(vipRoomDeletionSpy).not.toHaveBeenCalledWith(regularRoom)
		})

		it("should trigger both handlers when deleting a room (all rooms + specific)", async () => {
			const vipRoom = "vip-room"

			serverSocket.join(vipRoom)
			serverSocket.leave(vipRoom)

			await waitFor(50)

			expect(allRoomsSpy).toHaveBeenNthCalledWith(1, vipRoom)
			expect(vipRoomDeletionSpy).toHaveBeenNthCalledWith(1, vipRoom)
		})

		it("should not trigger for a room that not exist", async () => {
			serverSocket.leave("unexisting-room")

			await waitFor(50)

			expect(allRoomsSpy).not.toHaveBeenCalled()
		})

		it("should not trigger for socket id room", async () => {
			const testRoom = "test-room"

			serverSocket.join(testRoom)
			serverSocket.leave(testRoom)

			await waitFor(50)

			expect(allRoomsSpy).not.toHaveBeenNthCalledWith(1, serverSocket.id)
		})
	})
})
