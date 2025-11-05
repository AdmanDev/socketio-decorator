import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "@jest/globals"
import { Server } from "socket.io"
import { Socket as ClientSocket } from "socket.io-client"
import { SocketOn } from "../../../../../src"
import { IoCContainer } from "../../../../../src/IoCContainer"
import { createServer, createSocketClient } from "../../../../utilities/serverUtils"
import { waitFor } from "../../../../utilities/testUtils"
import { InMemoryThrottleStorage } from "../../../../../src/Wrappers/throttle/InMemoryThrottleStorage"
import { ConfigStore } from "../../../../../src/MetadataRepository/Stores/ConfigStore"

describe("> Throttle storage tests", () => {
	let io: Server
	let clientSocket: ClientSocket
	let store: InMemoryThrottleStorage

	class ControllerTest {
		@SocketOn("no-custom-throttle-event")
		public noCustomThrottleEvent () {
			// No operation
		}
	}

	beforeAll((done) => {
		io = createServer(
			{
				controllers: [ControllerTest],
				throttleConfig: {
					rateLimitConfig: {
						limit: 5,
						timeWindowMs: 200
					},
					cleanupIntervalMs: 1000
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

	describe("> Functional tests", () => {
		describe("> Stoage cleanup", () => {
			it("should cleanup throttle data after the time window", async () => {
				clientSocket.emit("no-custom-throttle-event")

				await waitFor(100)
				const beforeCleanupStoreDataSize = (await store.getAll()).size

				await waitFor(1100)

				const afterCleanupStoreDataSize = (await store.getAll()).size

				expect(beforeCleanupStoreDataSize).toBe(1)
				expect(afterCleanupStoreDataSize).toBe(0)
			})
		})

		describe("> Custom user identifier", () => {
			afterAll(() => {
				ConfigStore.get().throttleConfig!.getUserIdentifier = undefined
			})

			it("should use custom user identifier for throttle storage", async () => {
				ConfigStore.get().throttleConfig!.getUserIdentifier = (socket) => `custom-${socket.id}`

				clientSocket.emit("no-custom-throttle-event")

				await waitFor(100)

				const clientStoreData = await store.get(`custom-${clientSocket.id}`, "no-custom-throttle-event")

				expect(clientStoreData).toBeDefined()
			})

			it("should use socket.id if custom user identifier is undefined", async () => {
				ConfigStore.get().throttleConfig!.getUserIdentifier = undefined

				clientSocket.emit("no-custom-throttle-event")

				await waitFor(100)

				const clientStoreData = await store.get(clientSocket.id!, "no-custom-throttle-event")

				expect(clientStoreData).toBeDefined()
			})
		})
	})
})