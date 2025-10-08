import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, jest } from "@jest/globals"
import { Server } from "socket.io"
import { Socket as ClientSocket } from "socket.io-client"
import { EventName, SocketEmitter, SocketOn, SocketOnAnyOutgoing } from "../../../../src"
import { createServer, createSocketClient } from "../../../utilities/serverUtils"
import { waitFor } from "../../../utilities/testUtils"

describe("> EventName Decorator", () => {
	let io: Server
	let clientSocket: ClientSocket

	const simpleTestFn = jest.fn()

	class ControllerTest {
		@SocketOn("event-test-1")
		@SocketOn("event-test-2")
		public onEventTest (@EventName() eventName: string) {
			simpleTestFn(eventName)
		}

		@SocketOn("emit-event")
		@SocketEmitter("emit-event-resp")
		public onEmitEvent () {
			return {}
		}

		@SocketOnAnyOutgoing()
		public onAnyOutgoingEvent (@EventName() eventName: string) {
			simpleTestFn(eventName)
		}
	}

	beforeAll((done) => {
		io = createServer(
			{
				controllers: [ControllerTest]
			},
			{
				onServerListen: done
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
		it.each([
			["event-test-1"],
			["event-test-2"]
		])("should inject the event name for %s", async (eventName) => {
			clientSocket.emit(eventName)

			await waitFor(50)

			expect(simpleTestFn).toHaveBeenCalledWith(eventName)
		})

		it("should inject the event name for any outgoing event", async () => {
			clientSocket.emit("emit-event")

			await waitFor(50)

			expect(simpleTestFn).toHaveBeenCalledWith("emit-event-resp")
		})
	})
})
