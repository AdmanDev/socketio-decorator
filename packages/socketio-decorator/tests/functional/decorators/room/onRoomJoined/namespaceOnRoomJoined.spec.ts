import { describe, jest, beforeAll, beforeEach, afterEach, it, expect } from "@jest/globals"
import { Server, Socket as ServerSocket } from "socket.io"
import { Socket as ClientSocket } from "socket.io-client"
import { OnRoomJoined } from "../../../../../src"
import { createServer, createSocketClient } from "../../../../utilities/serverUtils"
import { waitFor } from "../../../../utilities/testUtils"

describe("> @OnRoomJoined with namespace awareness test", () => {
	let io: Server
	let nsSocketServer: ServerSocket
	let nsSocketClient: ClientSocket

	const namespaceSpy = jest.fn()
	const noNamespaceSpy = jest.fn()

	class RoomEvents {
		@OnRoomJoined("room-1")
		public onRoomJoined (roomName: string, socket: ServerSocket) {
			noNamespaceSpy(roomName, socket.id)
		}

		@OnRoomJoined("room-1", { namespace: "/custom" })
		public onRoomJoinedInNamespace (roomName: string, socket: ServerSocket) {
			namespaceSpy(roomName, socket.id)
		}
	}

	beforeAll((done) => {
		io = createServer(
			{
				roomEventListeners: [RoomEvents],
				controllers: []
			},
			{
				onServerListen: () => {
					io.of("/custom").on("connection", (socket) => {
						nsSocketServer = socket
					})
					done()
				},
			}
		)
	})

	beforeEach((done) => {
		nsSocketClient = createSocketClient(done, true, "custom")
	})

	afterEach(() => {
		io.sockets.adapter.rooms.clear()
		nsSocketClient?.disconnect()
	})

	it("should trigger handler in the correct namespace", async () => {
		const roomName = "room-1"

		nsSocketServer.join(roomName)

		await waitFor(50)

		expect(namespaceSpy).toHaveBeenCalledWith(roomName, nsSocketServer.id)
		expect(noNamespaceSpy).not.toHaveBeenCalled()
	})
})