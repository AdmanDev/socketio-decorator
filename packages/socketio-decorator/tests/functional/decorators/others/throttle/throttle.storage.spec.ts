import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "@jest/globals"
import { Server } from "socket.io"
import { Socket as ClientSocket } from "socket.io-client"
import { SocketOn } from "../../../../../src"
import { IoCContainer } from "../../../../../src/IoCContainer"
import { InMemoryThrottleStorage } from "../../../../../src/Wrappers/throttle/InMemoryThrottleStorage"
import { createServer, createSocketClient } from "../../../../utilities/serverUtils"
import { waitFor } from "../../../../utilities/testUtils"

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
	})
})