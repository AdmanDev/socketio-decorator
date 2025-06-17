import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, jest } from "@jest/globals"
import { Server } from "socket.io"
import { Socket as ClientSocket } from "socket.io-client"
import { Data, SocketOn } from "../../../../src"
import { MessageData } from "../../../types/socketData"
import { createServer, createSocketClient } from "../../../utilities/serverUtils"
import { waitFor } from "../../../utilities/testUtils"

describe("> Data Decorator", () => {
	let io: Server
	let clientSocket: ClientSocket

	const simpleTestFn = jest.fn()

	class ControllerTest {
		@SocketOn("simple-test")
		public onSimpleTest (someParam: undefined, @Data() data: MessageData) {
			simpleTestFn(someParam, data)
		}

		@SocketOn("multiple-data-test")
		public onMultipleDataTest (@Data() data0: MessageData, @Data(1) data1: MessageData) {
			simpleTestFn(data0, data1)
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
		it("should inject data into the method parameter", async () => {
			const data: MessageData = { message: "Hello World" }
			clientSocket.emit("simple-test", data)

			await waitFor(50)

			expect(simpleTestFn).toHaveBeenCalledWith(undefined, data)
		})

		it("should inject multiple data into the method parameter", async () => {
			const data0: MessageData = { message: "Hello World" }
			const data1: MessageData = { message: "Hello Again" }

			clientSocket.emit("multiple-data-test", data0, data1)

			await waitFor(50)

			expect(simpleTestFn).toHaveBeenCalledWith(data0, data1)
		})
	})
})