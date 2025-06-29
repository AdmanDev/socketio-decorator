import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, jest } from "@jest/globals"
import { Server, Socket as ServerSocket } from "socket.io"
import { Socket as ClientSocket } from "socket.io-client"
import { SocketOn, CurrentSocket } from "../../../../src"
import { createServer, createSocketClient } from "../../../utilities/serverUtils"
import { MessageData } from "../../../types/socketData"

describe("> DisableParamInjection option tests", () => {
	let io: Server
	let clientSocket: ClientSocket

	const simpleTestFn = jest.fn()

	class ControllerTest {
		@SocketOn("simple-test")
		public onSimpleTest (socket: ServerSocket, @CurrentSocket() data: MessageData) {
			simpleTestFn(socket.id, data)
			socket.emit("simple-test-resp")
		}
	}

	beforeAll((done) => {
		io = createServer(
			{
				controllers: [ControllerTest],
				disableParamInjection: true
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
		it("should not inject socket into the method parameter and provide raw arguments when disableParamInjection is true", (done) => {
			const data: MessageData = {
				message: "Hello, world!"
			}

			clientSocket.on("simple-test-resp", () => {
				expect(simpleTestFn).toHaveBeenCalledWith(clientSocket.id, data)
				done()
			})

			clientSocket.emit("simple-test", data)
		})
	})
})