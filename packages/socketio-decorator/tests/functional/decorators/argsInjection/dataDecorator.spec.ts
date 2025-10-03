import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, jest } from "@jest/globals"
import { Server } from "socket.io"
import { Socket as ClientSocket } from "socket.io-client"
import { Data, SocketOn } from "../../../../src"
import { SiodDecoratorError } from "../../../../src/Models/Errors/SiodDecoratorError"
import { MessageData } from "../../../types/socketData"
import { createServer, createSocketClient } from "../../../utilities/serverUtils"
import { waitFor } from "../../../utilities/testUtils"

describe("> Data Decorator", () => {
	let io: Server
	let clientSocket: ClientSocket

	const simpleTestFn = jest.fn()

	class ControllerTest {
		@SocketOn("simple-test")
		public onSimpleTest (@Data() data: MessageData) {
			simpleTestFn(data)
		}

		@SocketOn("test-with-data-in-second-parameter")
		public onTestWithDataInSecondPosition (something: string, @Data() data: MessageData) {
			simpleTestFn(data)
		}

		@SocketOn("multiple-data-test")
		public onMultipleDataTest (@Data() data0: MessageData, @Data(1) data1: MessageData) {
			simpleTestFn(data0, data1)
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
		it("should inject data into the method parameter", async () => {
			const data: MessageData = { message: "Hello World" }
			clientSocket.emit("simple-test", data)

			await waitFor(50)

			expect(simpleTestFn).toHaveBeenCalledWith(data)
		})

		it("should inject the data regardless of the order of the parameters", async () => {
			const data: MessageData = { message: "Hello World" }
			clientSocket.emit("test-with-data-in-second-parameter", data)

			await waitFor(50)

			expect(simpleTestFn).toHaveBeenCalledWith(data)
		})

		it("should inject multiple data into the method parameter", async () => {
			const data0: MessageData = { message: "Hello World" }
			const data1: MessageData = { message: "Hello Again" }

			clientSocket.emit("multiple-data-test", data0, data1)

			await waitFor(50)

			expect(simpleTestFn).toHaveBeenCalledWith(data0, data1)
		})

		it("should throw SiodDecoratorError when dataIndex is negative", () => {
			expect(() => {
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				class TestClass {
					public testMethod (@Data(-1) data: unknown) {
						return data
					}
				}
			}).toThrow(SiodDecoratorError)

			expect(() => {
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				class TestClass {
					public testMethod (@Data(-1) data: unknown) {
						return data
					}
				}
			}).toThrow("Data index must be a non-negative number.")
		})
	})
})
