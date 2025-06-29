import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, jest } from "@jest/globals"
import { Server, Socket as ServerSocket } from "socket.io"
import { Socket as ClientSocket } from "socket.io-client"
import { SocketOn, CurrentSocket } from "../../../../src"
import { createServer, createSocketClient } from "../../../utilities/serverUtils"

describe("> CurrentSocket Decorator", () => {
	let io: Server
	let clientSocket: ClientSocket

	const simpleTestFn = jest.fn()

	class ControllerTest {
		@SocketOn("simple-test")
		public onSimpleTest (someParam: undefined, @CurrentSocket() socket: ServerSocket) {
			simpleTestFn(someParam, socket.id)
			socket.emit("simple-test-resp")
		}
	}

	beforeAll((done) => {
		io = createServer(
			{
				controllers: [ControllerTest],
				disableParamInjection: false
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
		it("should inject socket into the method parameter", (done) => {
			clientSocket.on("simple-test-resp", () => {
				expect(simpleTestFn).toHaveBeenCalledWith(undefined, clientSocket.id)
				done()
			})

			clientSocket.emit("simple-test")
		})
	})
})