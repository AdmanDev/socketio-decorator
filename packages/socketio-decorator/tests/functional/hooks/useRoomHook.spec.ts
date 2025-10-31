import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "@jest/globals"
import { Server, Socket as ServerSocket } from "socket.io"
import { Socket as ClientSocket } from "socket.io-client"
import { useRoom, useRoomStore } from "../../../src"
import { RoomTest } from "../../types/roomTest"
import { createServer, createSocketClient } from "../../utilities/serverUtils"

describe("> UseRoom hook tests", () => {
	let io: Server
	let clientSocket: ClientSocket
	let serverSocket: ServerSocket

	beforeAll((done) => {
		io = createServer(
			{
				controllers: [],
			},
			{
				onServerListen: done,
				onServerSocketConnection: (socket) => serverSocket = socket
			}
		)
	})

	beforeEach((done) => {
		clientSocket = createSocketClient(done)
	})

	afterEach(() => {
		clientSocket?.disconnect()
	})

	afterAll(() => {
		io.close()
	})

	describe("> Room instance tests", () => {
		it("should get the room instance", () => {
			const roomName = "test-room"
			const roomStore = useRoomStore<RoomTest>()

			const expectedRoom: RoomTest = {
				id: roomName,
				messages: ["Test Room"]
			}

			roomStore.addRoom(roomName, expectedRoom)

			const { room: actualRoom } = useRoom<RoomTest>(roomName)

			expect(actualRoom).toEqual(expectedRoom)
		})

		it("should return null if the room doesn't exist", () => {
			const { room: actualRoom } = useRoom<RoomTest>("non-existent-room")
			expect(actualRoom).toBeNull()
		})
	})

	describe("> GetClients tests", () => {
		it("should get the list of clients in the room", () => {
			const roomName = "clients-room"
			serverSocket.join(roomName)

			const { getClients } = useRoom<RoomTest>(roomName)
			const clients = getClients()

			expect(clients).toBeInstanceOf(Array)
			expect(clients).toContain(serverSocket.id)
		})

		it("should return an empty array if the room has no clients", () => {
			const roomName = "empty-room"

			const { getClients } = useRoom<RoomTest>(roomName)
			const clients = getClients()

			expect(clients).toBeInstanceOf(Array)
			expect(clients).toHaveLength(0)
		})
	})

	describe("> IsEmpty tests", () => {
		it("should return false if the room has clients", () => {
			const roomName = "non-empty-room"
			serverSocket.join(roomName)

			const { isEmpty } = useRoom<RoomTest>(roomName)
			const emptyStatus = isEmpty()

			expect(emptyStatus).toBe(false)
		})

		it("should return true if the room is empty", () => {
			const roomName = "empty-room"

			const { isEmpty } = useRoom<RoomTest>(roomName)
			const emptyStatus = isEmpty()

			expect(emptyStatus).toBe(true)
		})
	})

	describe("> HasClientInRoom tests", () => {
		it("should return true if the client is in the room", () => {
			const roomName = "client-in-room"
			serverSocket.join(roomName)

			const { hasClientInRoom } = useRoom<RoomTest>(roomName)
			const hasClient = hasClientInRoom(serverSocket.id)

			expect(hasClient).toBe(true)
		})

		it("should return false if the client is not in the room", () => {
			const roomName = "client-not-in-room"

			const { hasClientInRoom } = useRoom<RoomTest>(roomName)
			const hasClient = hasClientInRoom("non-existent-client-id")

			expect(hasClient).toBe(false)
		})
	})
})