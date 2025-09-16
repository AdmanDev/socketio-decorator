import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "@jest/globals"
import { Server } from "socket.io"
import { Socket as ClientSocket } from "socket.io-client"
import { SocketOn } from "../../../../../src"
import { IoCContainer } from "../../../../../src/IoCContainer"
import { InMemoryThrottleStorage } from "../../../../../src/Wrappers/throttle/InMemoryThrottleStorage"
import { createServer, createSocketClient } from "../../../../utilities/serverUtils"
import { waitFor } from "../../../../utilities/testUtils"

describe("> Throttle User Identifier tests", () => {
	class ControllerTest {
		@SocketOn("no-custom-throttle-event")
		public noCustomThrottleEvent () {
			// No operation
		}
	}

	describe("> Functional tests", () => {
		describe("> Custom user identifier", () => {
			let io: Server
			let clientSocket: ClientSocket
			let store: InMemoryThrottleStorage

			beforeAll((done) => {
				io = createServer(
					{
						controllers: [ControllerTest],
						throttleConfig: {
							rateLimitConfig: {
								limit: 5,
								timeWindowMs: 200
							},
							cleanupIntervalMs: 1000,
							getUserIdentifier: (socket) => `custom-${socket.id}`
						}
					},
					{
						onServerListen: () => {
							store = IoCContainer.getInstance<InMemoryThrottleStorage>(InMemoryThrottleStorage)
							done()
						},
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

			it("should use custom user identifier for throttle storage", async () => {
				clientSocket.emit("no-custom-throttle-event")

				await waitFor(100)

				const clientStoreData = await store.get(`custom-${clientSocket.id}`, "no-custom-throttle-event")

				expect(clientStoreData).toBeDefined()
			})
		})

		describe("> Without custom user identifier", () => {
			let io: Server
			let clientSocket: ClientSocket
			let store: InMemoryThrottleStorage

			beforeAll((done) => {
				io = createServer(
					{
						controllers: [ControllerTest],
						throttleConfig: {
							rateLimitConfig: {
								limit: 5,
								timeWindowMs: 200
							},
							cleanupIntervalMs: 1000,
						}
					},
					{
						onServerListen: () => {
							store = IoCContainer.getInstance<InMemoryThrottleStorage>(InMemoryThrottleStorage)
							done()
						},
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

			it("should use socket.id if custom user identifier is undefined", async () => {
				clientSocket.emit("no-custom-throttle-event")

				await waitFor(100)

				const clientStoreData = await store.get(clientSocket.id!, "no-custom-throttle-event")

				expect(clientStoreData).toBeDefined()
			})
		})
	})
})