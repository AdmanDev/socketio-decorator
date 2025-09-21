import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, jest } from "@jest/globals"
import { Server, Socket as ServerSocket } from "socket.io"
import { Socket as ClientSocket } from "socket.io-client"
import { Data, IErrorMiddleware, SocketData, SocketDataStore, SocketOn } from "../../../../src"
import { createServer, createSocketClient } from "../../../utilities/serverUtils"
import { waitFor } from "../../../utilities/testUtils"

describe("> Socket Data Decorator", () => {
	let io: Server
	let clientSocket: ClientSocket
	let serverSocket: ServerSocket

	const simpleTestFn = jest.fn()
	const dataWithKeyFn = jest.fn()
	const errorMiddlewareSpy = jest.fn()

	class ErrorMiddleware implements IErrorMiddleware {
		public handleError (error: unknown) {
			errorMiddlewareSpy(error)
		}
	}

	class ControllerTest {
		@SocketOn("simple-test")
		public onSimpleTest (@SocketData() data: SocketDataStore) {
			simpleTestFn(data)
		}

		@SocketOn("data-store-actions-test")
		public onDataStoreActionsTest (@Data() action: string, @SocketData() dataStore: SocketDataStore) {
			switch (action) {
				case "get":
					simpleTestFn(dataStore.getData("firstName"))
					break
				case "set":
					dataStore.setData("firstName", "John")
					break
				case "remove":
					dataStore.removeData("firstName")
					break
				case "has":
					simpleTestFn(dataStore.hasData("firstName"))
					break
				default:
					throw new Error("Unknown action: " + action)
			}
		}

		@SocketOn("data-with-key-set")
		public onDataWithKeySet (@SocketData("lastName") dataValue: unknown) {
			dataWithKeyFn(dataValue)
		}
	}

	beforeAll((done) => {
		io = createServer(
			{
				controllers: [ControllerTest],
				errorMiddleware: ErrorMiddleware,
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

	describe("> Functional tests", () => {
		it("Should inject SocketDataStore instance when data key is unset", async () => {
			clientSocket.emit("simple-test")

			await waitFor(50)

			expect(simpleTestFn).toHaveBeenCalledWith(expect.any(SocketDataStore))
		})

		it("should set socket data attribute via the data store", async () => {
			clientSocket.emit("data-store-actions-test", "set")

			await waitFor(50)

			expect(serverSocket.data["firstName"]).toBe("John")
		})

		it("should get socket data attribute via the data store", async () => {
			clientSocket.emit("data-store-actions-test", "set")
			clientSocket.emit("data-store-actions-test", "get")

			await waitFor(200)

			expect(simpleTestFn).toHaveBeenCalledWith("John")
		})

		it("should inject null via data store when socket data attribute with specified key does not exist", async () => {
			clientSocket.emit("data-store-actions-test", "get")

			await waitFor(50)

			expect(simpleTestFn).toHaveBeenCalledWith(null)
		})

		it("should check existence of socket data attribute via the data store", async () => {
			clientSocket.emit("data-store-actions-test", "set")
			clientSocket.emit("data-store-actions-test", "has")

			await waitFor(200)
			expect(simpleTestFn).toHaveBeenCalledWith(true)
		})

		it("should remove socket data attribute via the data store", async () => {
			clientSocket.emit("data-store-actions-test", "set")
			clientSocket.emit("data-store-actions-test", "remove")
			clientSocket.emit("data-store-actions-test", "has")

			await waitFor(200)

			expect(simpleTestFn).toHaveBeenCalledWith(false)
		})

		it("should inject socket data attribute value when data key is set", async () => {
			serverSocket.data["lastName"] = "Doe"

			clientSocket.emit("data-with-key-set")

			await waitFor(50)

			expect(dataWithKeyFn).toHaveBeenCalledWith("Doe")
		})

		it("should inject null when socket data attribute with specified key does not exist", async () => {
			clientSocket.emit("data-with-key-set")

			await waitFor(50)

			expect(dataWithKeyFn).toHaveBeenCalledWith(null)
		})
	})
})