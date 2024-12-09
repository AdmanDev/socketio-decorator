import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, jest } from "@jest/globals"
import { createSocketClient, createServer } from "../../../utilities/serverUtils"
import { Server, Socket } from "socket.io"
import { Socket as ClientSocket } from "socket.io-client"
import { ServerOn } from "../../../../src"

describe("> ServerOn decorator", () => {
	let io: Server
	let clientSocket: ClientSocket

	const connectionCallback = jest.fn()

	class ServerOnController {

		@ServerOn("connection")
		public onConnection (socket: Socket) {
			connectionCallback(socket.id)
		}
	}

	beforeAll((done) => {
		io = createServer(
			{
				controllers: [ServerOnController]
			},
			{
				onServerListen: done
			}
		)
	})

	beforeEach(() => {
		clientSocket = createSocketClient()
	})

	afterEach(() => {
		clientSocket.disconnect()
	})

	afterAll(() => {
		io.close()
	})

	describe("> Functional tests", () => {
		it("should register a method as a listener for the connection event", (done) => {
			clientSocket.on("connect", () => {
				expect(connectionCallback).toHaveBeenCalledTimes(1)
				expect(connectionCallback).toHaveBeenCalledWith(clientSocket.id)
				done()
			})

			clientSocket.connect()
		})
	})
})