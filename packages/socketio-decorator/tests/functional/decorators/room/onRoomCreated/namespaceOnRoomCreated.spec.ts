import { describe, jest, beforeAll, beforeEach, afterEach, it, expect } from "@jest/globals"
import { Server, Socket as ServerSocket } from "socket.io"
import { Socket as ClientSocket } from "socket.io-client"
import { OnRoomCreated } from "../../../../../src"
import { createServer, createSocketClient } from "../../../../utilities/serverUtils"
import { waitFor } from "../../../../utilities/testUtils"

describe("> @OnRoomCreated with namespace awareness test", () => {
	let io: Server
	let nsSocketServer: ServerSocket
	let nsSocketClient: ClientSocket

	const namespaceSpy = jest.fn()
	const noNamespaceSpy = jest.fn()

	class RoomEvents {
		@OnRoomCreated()
		public onRoomCreated (roomName: string) {
			noNamespaceSpy(roomName)
		}

		@OnRoomCreated(undefined, { namespace: "/custom" })
		public onRoomCreatedInNamespace (roomName: string) {
			namespaceSpy(roomName)
		}
	}

	beforeAll((done) => {
		io = createServer(
			{
				roomEventListeners: [RoomEvents],
				controllers: [],
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

	afterEach(async () => {
		io.sockets.adapter.rooms.clear()
		nsSocketClient?.disconnect()
	})

	it("should trigger handler in the correct namespace", async () => {
		const roomName = "room-1"

		nsSocketServer.join(roomName)
		await waitFor(50)

		expect(namespaceSpy).toHaveBeenCalledWith(roomName)
		expect(noNamespaceSpy).not.toHaveBeenCalled()
	})
})
