import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, jest } from "@jest/globals"
import { Server, Socket as ServerSocket } from "socket.io"
import { Socket as ClientSocket } from "socket.io-client"
import { OnRoomCreated } from "../../../../../src"
import { createServer, createSocketClient } from "../../../../utilities/serverUtils"
import { waitFor } from "../../../../utilities/testUtils"

describe("> OnRoomCreated decorator", () => {
	let io: Server
	let serverSocket: ServerSocket
	let clientSocket: ClientSocket

	const allRoomsSpy = jest.fn()
	const vipRoomCreationSpy = jest.fn()
	const chatRoomWildcardSpy = jest.fn()

	class OnRoomCreatedEvents {
		@OnRoomCreated()
		public onAnyRoomCreated (roomName: string) {
			allRoomsSpy(roomName)
		}

		@OnRoomCreated("vip-room")
		public onVipRoomCreated (roomName: string) {
			vipRoomCreationSpy(roomName)
		}

		@OnRoomCreated("*-chat")
		public onChatRoomCreated (roomName: string) {
			chatRoomWildcardSpy(roomName)
		}

		@OnRoomCreated("*-non-matching-room")
		public onNonMatchingRoomCreated (roomName: string) {
			chatRoomWildcardSpy(roomName)
		}
	}

	beforeAll((done) => {
		io = createServer(
			{
				roomEventListeners: [OnRoomCreatedEvents],
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
		it("should trigger handler when any room is created (no room filter)", async () => {
			const roomName = "test-room"

			serverSocket.join(roomName)
			await waitFor(50)

			expect(allRoomsSpy).toHaveBeenNthCalledWith(1, roomName)
		})

		it("should trigger handler only for the specified room", async () => {
			const vipRoom = "vip-room"
			const regularRoom = "regular-room"

			serverSocket.join(vipRoom)
			serverSocket.join(regularRoom)

			await waitFor(50)

			expect(vipRoomCreationSpy).toHaveBeenNthCalledWith(1, vipRoom)
			expect(vipRoomCreationSpy).not.toHaveBeenCalledWith(regularRoom)
		})

		it("should trigger both handlers when creating a room (all rooms + specific)", async () => {
			const vipRoom = "vip-room"

			serverSocket.join(vipRoom)

			await waitFor(50)

			expect(allRoomsSpy).toHaveBeenNthCalledWith(1, vipRoom)
			expect(vipRoomCreationSpy).toHaveBeenNthCalledWith(1, vipRoom)
		})

		it("should not trigger for socket id room", async () => {
			const testRoom = "test-room"

			serverSocket.join(testRoom)
			await waitFor(50)

			expect(allRoomsSpy).not.toHaveBeenNthCalledWith(1, serverSocket.id)
		})

		it("should not trigger when the room already exists", async () => {
			const testRoom = "test-room"

			const secondClientSocket = createSocketClient()
			await waitFor(50)

			const secondServerSocket = io.of("/").sockets.get(secondClientSocket.id!)

			if (!secondServerSocket) {
				throw new Error("Second socket is not connected")
			}

			secondServerSocket.join(testRoom)
			serverSocket.join(testRoom)

			await waitFor(50)

			expect(allRoomsSpy).toHaveBeenNthCalledWith(1, testRoom)
		})

		it("should trigger handler for rooms matching wildcard pattern", async () => {
			const chatRoom1 = "123-chat"
			const chatRoom2 = "456-chat"
			const chatRoomAbc = "abc-chat"
			const nonMatchingRoom = "lobby-123"

			serverSocket.join(chatRoom1)
			serverSocket.join(chatRoom2)
			serverSocket.join(chatRoomAbc)
			serverSocket.join(nonMatchingRoom)

			await waitFor(50)

			expect(chatRoomWildcardSpy).toHaveBeenCalledTimes(3)
			expect(chatRoomWildcardSpy).toHaveBeenCalledWith(chatRoom1)
			expect(chatRoomWildcardSpy).toHaveBeenCalledWith(chatRoom2)
			expect(chatRoomWildcardSpy).toHaveBeenCalledWith(chatRoomAbc)
			expect(chatRoomWildcardSpy).not.toHaveBeenCalledWith(nonMatchingRoom)
		})
	})
})
