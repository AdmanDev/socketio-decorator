import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, jest } from "@jest/globals"
import { Server } from "socket.io"
import { Socket as ClientSocket } from "socket.io-client"
import { Data, IErrorMiddleware, SiodImcomigDataError, SocketOn } from "../../../../src"
import { MessageData, UserData } from "../../../types/socketData"
import { createServer, createSocketClient } from "../../../utilities/serverUtils"
import { waitFor } from "../../../utilities/testUtils"
import { SiodDecoratorError } from "../../../../src/Models/Errors/SiodDecoratorError"

describe("> Data Decorator", () => {
	let io: Server
	let clientSocket: ClientSocket

	const simpleTestFn = jest.fn()
	const errorMiddlewareSpy = jest.fn()

	class ErrorMiddleware implements IErrorMiddleware {
		public handleError (error: unknown) {
			errorMiddlewareSpy(error)
		}
	}

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

		@SocketOn("multiple-data-validation-test")
		public onMultipleDataValidationTest (@Data() data0: MessageData, @Data(1) data1: UserData) {
			simpleTestFn(data0, data1)
		}

		@SocketOn("test-with-data-index-out-of-bounds")
		public onTestWithDataIndexOutOfBounds (@Data(999) data: MessageData) {
			simpleTestFn(data)
		}
	}

	beforeAll((done) => {
		io = createServer(
			{
				controllers: [ControllerTest],
				errorMiddleware: ErrorMiddleware,
				dataValidationEnabled: true
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

	describe("> Data validation tests", () => {
		it("should throw an error if data is not valid", async () => {
			const event = "simple-test"

			clientSocket.emit(event)

			await waitFor(50)

			expect(simpleTestFn).not.toHaveBeenCalled()
			expect(errorMiddlewareSpy).toHaveBeenCalledTimes(1)
			expect(errorMiddlewareSpy).toHaveBeenCalledWith(expect.any(SiodImcomigDataError))
		})

		it("should throw SiodImcomigDataError when dataIndex is out of bounds", async () => {
			const data: MessageData = { message: "Hello World" }
			clientSocket.emit("test-with-data-index-out-of-bounds", data)

			await waitFor(50)

			expect(simpleTestFn).not.toHaveBeenCalled()
			expect(errorMiddlewareSpy).toHaveBeenCalledTimes(1)
			expect(errorMiddlewareSpy).toHaveBeenCalledWith(expect.any(SiodImcomigDataError))
		})

		it("should validate all incoming data", async () => {
			const goodData: MessageData = { message: "Hello World" }
			const invalidData = { wrong: "data" }

			const event = "multiple-data-validation-test"

			clientSocket.emit(event, goodData, invalidData)

			await waitFor(50)

			expect(simpleTestFn).not.toHaveBeenCalled()
			expect(errorMiddlewareSpy).toHaveBeenCalledTimes(1)
			expect(errorMiddlewareSpy).toHaveBeenCalledWith(expect.any(SiodImcomigDataError))
		})
	})
})