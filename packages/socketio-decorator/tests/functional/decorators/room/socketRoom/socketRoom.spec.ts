import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, jest } from "@jest/globals"
import { Server, Socket as ServerSocket } from "socket.io"
import { IErrorMiddleware, SocketOn, SocketRoom, useRoomStore } from "../../../../../src"
import { Socket as ClientSocket } from "socket.io-client"
import { createServer, createSocketClient } from "../../../../utilities/serverUtils"
import { RoomTest } from "../../../../types/roomTest"
import { waitFor } from "../../../../utilities/testUtils"
import { SiodRequiredRoomError } from "../../../../../src/Models/Errors/SiodRequiredRoomError"

describe("> SocketRoom Decorator tests", () => {
	let io: Server
	let serverSocket: ServerSocket
	let clientSocket: ClientSocket

	const roomStore = useRoomStore<RoomTest>()

	const simpleTestFn = jest.fn()
	const errorMiddlewareFn = jest.fn()

	class ErrorMiddleware implements IErrorMiddleware {
		public handleError (err: Error): void {
			errorMiddlewareFn(err)
		}
	}

	class ControllerTest {
		@SocketOn("all-room-test")
		public onAllRoomTest (@SocketRoom() roomData: RoomTest[]) {
			simpleTestFn(roomData)
		}

		@SocketOn("spec-room-test")
		public onSpecificTest (@SocketRoom("chat-1") roomData: RoomTest) {
			simpleTestFn(roomData)
		}

		@SocketOn("required-error-room-test")
		public onRequiredErrorTest (@SocketRoom("chat-1", { required: true }) roomData: RoomTest) {
			simpleTestFn(roomData)
		}
	}

	beforeAll((done) => {
		io = createServer(
			{
				controllers: [ControllerTest],
				errorMiddleware: ErrorMiddleware
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
		roomStore.clearAllRooms()
		clientSocket?.disconnect()
	})

	afterAll(() => {
		io.close()
	})

	describe("> Functional tests", () => {
		it("should inject all rooms data into the method parameter", async () => {
			const notIncludedRoom: RoomTest = {
				id: "not-included-room",
				messages: [],
			}

			const rooms: RoomTest[] = [
				{
					id: "chat-1",
					messages: [],
				},
				{
					id: "chat-2",
					messages: [],
				},
			]

			for (const room of rooms) {
				serverSocket.join(room.id)
				roomStore.addRoom(room.id, room)
			}

			roomStore.addRoom(notIncludedRoom.id, notIncludedRoom)

			clientSocket.emit("all-room-test")

			await waitFor(50)

			expect(simpleTestFn).toHaveBeenNthCalledWith(1, rooms)
		})

		it("should inject an empty array if the socket is not in any room", async () => {
			clientSocket.emit("all-room-test")

			await waitFor(50)

			expect(simpleTestFn).toHaveBeenNthCalledWith(1, [])
		})

		it("should inject a specific room data into the method parameter", async () => {
			const roomData: RoomTest = {
				id: "chat-1",
				messages: [],
			}

			serverSocket.join(roomData.id)
			roomStore.addRoom(roomData.id, roomData)

			clientSocket.emit("spec-room-test")

			await waitFor(50)

			expect(simpleTestFn).toHaveBeenNthCalledWith(1, roomData)
		})

		it("should inject null if the socket is not in the specific room", async () => {
			const roomData: RoomTest = {
				id: "chat-1",
				messages: [],
			}

			roomStore.addRoom(roomData.id, roomData)

			clientSocket.emit("spec-room-test")

			await waitFor(50)

			expect(simpleTestFn).toHaveBeenNthCalledWith(1, null)
		})

		it("should inject null if socket is in the specific room but the room data is not found", async () => {
			serverSocket.join("chat-1")

			clientSocket.emit("spec-room-test")

			await waitFor(50)

			expect(simpleTestFn).toHaveBeenNthCalledWith(1, null)
		})

		it("should throw an SiodRequiredRoomError if it's a required room and the socket is not in", async () => {
			clientSocket.emit("required-error-room-test")

			await waitFor(50)

			expect(errorMiddlewareFn).toHaveBeenNthCalledWith(1, expect.any(SiodRequiredRoomError))
			expect(simpleTestFn).not.toHaveBeenCalled()
		})
	})
})