import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, jest } from "@jest/globals"
import { Server, Socket as ServerSocket } from "socket.io"
import { Socket as ClientSocket } from "socket.io-client"
import { OnRoomCreated } from "../../../../../src"
import { createServer, createSocketClient } from "../../../../utilities/serverUtils"
import { waitFor } from "../../../../utilities/testUtils"

describe("> Room decorators - Wildcard patterns", () => {
	let io: Server
	let serverSocket: ServerSocket
	let clientSocket: ClientSocket

	const prefixWildcardSpy = jest.fn()
	const suffixWildcardSpy = jest.fn()
	const middleWildcardSpy = jest.fn()
	const multipleWildcardsSpy = jest.fn()
	const fullWildcardSpy = jest.fn()

	class WildcardPatternEvents {
		@OnRoomCreated("chat-*")
		public onPrefixPattern (roomName: string) {
			prefixWildcardSpy(roomName)
		}

		@OnRoomCreated("*-notifications")
		public onSuffixPattern (roomName: string) {
			suffixWildcardSpy(roomName)
		}

		@OnRoomCreated("game-*-lobby")
		public onMiddlePattern (roomName: string) {
			middleWildcardSpy(roomName)
		}

		@OnRoomCreated("*-room-*")
		public onMultipleWildcards (roomName: string) {
			multipleWildcardsSpy(roomName)
		}

		@OnRoomCreated("*")
		public onFullWildcard (roomName: string) {
			fullWildcardSpy(roomName)
		}
	}

	beforeAll((done) => {
		io = createServer(
			{
				roomEventListeners: [WildcardPatternEvents],
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
		jest.clearAllMocks()
		io.sockets.adapter.rooms.clear()
		clientSocket.disconnect()
	})

	afterAll(() => {
		io.close()
	})

	describe("> Wildcard variations", () => {
		it("should match prefix wildcard pattern (chat-*)", async () => {
			const room1 = "chat-123"
			const room2 = "chat-general"
			const room3 = "chat-vip"
			const nonMatching = "lobby-main"

			serverSocket.join(room1)
			serverSocket.join(room2)
			serverSocket.join(room3)
			serverSocket.join(nonMatching)

			await waitFor(50)

			expect(prefixWildcardSpy).toHaveBeenCalledTimes(3)
			expect(prefixWildcardSpy).toHaveBeenCalledWith(room1)
			expect(prefixWildcardSpy).toHaveBeenCalledWith(room2)
			expect(prefixWildcardSpy).toHaveBeenCalledWith(room3)
			expect(prefixWildcardSpy).not.toHaveBeenCalledWith(nonMatching)
		})

		it("should match suffix wildcard pattern (*-notifications)", async () => {
			const room1 = "user-notifications"
			const room2 = "admin-notifications"
			const room3 = "system-notifications"
			const nonMatching = "notifications-center"

			serverSocket.join(room1)
			serverSocket.join(room2)
			serverSocket.join(room3)
			serverSocket.join(nonMatching)

			await waitFor(50)

			expect(suffixWildcardSpy).toHaveBeenCalledTimes(3)
			expect(suffixWildcardSpy).toHaveBeenCalledWith(room1)
			expect(suffixWildcardSpy).toHaveBeenCalledWith(room2)
			expect(suffixWildcardSpy).toHaveBeenCalledWith(room3)
			expect(suffixWildcardSpy).not.toHaveBeenCalledWith(nonMatching)
		})

		it("should match middle wildcard pattern (game-*-lobby)", async () => {
			const room1 = "game-1-lobby"
			const room2 = "game-abc-lobby"
			const room3 = "game-tournament-lobby"
			const nonMatching1 = "game-1-room"
			const nonMatching2 = "match-1-lobby"

			serverSocket.join(room1)
			serverSocket.join(room2)
			serverSocket.join(room3)
			serverSocket.join(nonMatching1)
			serverSocket.join(nonMatching2)

			await waitFor(50)

			expect(middleWildcardSpy).toHaveBeenCalledTimes(3)
			expect(middleWildcardSpy).toHaveBeenCalledWith(room1)
			expect(middleWildcardSpy).toHaveBeenCalledWith(room2)
			expect(middleWildcardSpy).toHaveBeenCalledWith(room3)
			expect(middleWildcardSpy).not.toHaveBeenCalledWith(nonMatching1)
			expect(middleWildcardSpy).not.toHaveBeenCalledWith(nonMatching2)
		})

		it("should match multiple wildcards pattern (*-room-*)", async () => {
			const room1 = "user-room-1"
			const room2 = "admin-room-vip"
			const room3 = "guest-room-temp"
			const nonMatching = "user-chat-1"

			serverSocket.join(room1)
			serverSocket.join(room2)
			serverSocket.join(room3)
			serverSocket.join(nonMatching)

			await waitFor(50)

			expect(multipleWildcardsSpy).toHaveBeenCalledTimes(3)
			expect(multipleWildcardsSpy).toHaveBeenCalledWith(room1)
			expect(multipleWildcardsSpy).toHaveBeenCalledWith(room2)
			expect(multipleWildcardsSpy).toHaveBeenCalledWith(room3)
			expect(multipleWildcardsSpy).not.toHaveBeenCalledWith(nonMatching)
		})

		it("should match full wildcard pattern (*)", async () => {
			const room1 = "any-room-name"
			const room2 = "another-room"
			const room3 = "xyz"

			serverSocket.join(room1)
			serverSocket.join(room2)
			serverSocket.join(room3)

			await waitFor(50)

			expect(fullWildcardSpy).toHaveBeenCalledTimes(3)
			expect(fullWildcardSpy).toHaveBeenCalledWith(room1)
			expect(fullWildcardSpy).toHaveBeenCalledWith(room2)
			expect(fullWildcardSpy).toHaveBeenCalledWith(room3)
		})

		it("should handle complex patterns with special characters", async () => {
			const room1 = "chat-room-123"
			const room2 = "user-room-abc"

			serverSocket.join(room1)
			serverSocket.join(room2)

			await waitFor(50)

			expect(multipleWildcardsSpy).toHaveBeenCalledWith(room1)
			expect(multipleWildcardsSpy).toHaveBeenCalledWith(room2)
		})
	})
})
