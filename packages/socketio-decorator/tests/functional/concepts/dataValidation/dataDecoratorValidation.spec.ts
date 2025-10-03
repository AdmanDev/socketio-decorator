import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, jest } from "@jest/globals"
import { Server } from "socket.io"
import { Socket as ClientSocket } from "socket.io-client"
import { Data, IErrorMiddleware, SiodImcomigDataError, SocketOn } from "../../../../src"
import { MessageData, UserData } from "../../../types/socketData"
import { createSocketClient, createServer } from "../../../utilities/serverUtils"
import { waitFor } from "../../../utilities/testUtils"

describe("> @Data Decorator Validation", () => {
	let io: Server
	let clientSocket: ClientSocket

	const simpleTestFn = jest.fn()
	const errorMiddlewareSpy = jest.fn()

	class ErrorMiddleware implements IErrorMiddleware {
		public handleError (error: unknown) {
			errorMiddlewareSpy(error)
		}
	}

	class DataDecoratorController {
		@SocketOn("data-simple-test")
		public onDataSimpleTest (@Data() data: MessageData) {
			simpleTestFn(data)
		}

		@SocketOn("data-in-second-parameter")
		public onDataInSecondPosition (something: string, @Data() data: MessageData) {
			simpleTestFn(data)
		}

		@SocketOn("data-multiple-test")
		public onMultipleDataTest (@Data() data0: MessageData, @Data(1) data1: MessageData) {
			simpleTestFn(data0, data1)
		}

		@SocketOn("data-multiple-validation-test")
		public onMultipleDataValidationTest (@Data() data0: MessageData, @Data(1) data1: UserData) {
			simpleTestFn(data0, data1)
		}

		@SocketOn("data-index-out-of-bounds")
		public onDataIndexOutOfBounds (@Data(999) data: MessageData) {
			simpleTestFn(data)
		}
	}

	beforeAll((done) => {
		io = createServer(
			{
				controllers: [DataDecoratorController],
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

	it("should validate data", async () => {
		const data: MessageData = { message: "Hello World" }
		clientSocket.emit("data-simple-test", data)

		await waitFor(50)

		expect(errorMiddlewareSpy).not.toHaveBeenCalled()
		expect(simpleTestFn).toHaveBeenCalledWith(data)
	})

	it("should throw an error if data is not valid", async () => {
		const event = "data-simple-test"

		clientSocket.emit(event)

		await waitFor(50)

		expect(simpleTestFn).not.toHaveBeenCalled()
		expect(errorMiddlewareSpy).toHaveBeenCalledTimes(1)
		expect(errorMiddlewareSpy).toHaveBeenCalledWith(expect.any(SiodImcomigDataError))
	})

	it("should validate data regardless of parameter position", async () => {
		const data: MessageData = { message: "Hello World" }
		clientSocket.emit("data-in-second-parameter", data)

		await waitFor(50)

		expect(errorMiddlewareSpy).not.toHaveBeenCalled()
		expect(simpleTestFn).toHaveBeenCalledWith(data)
	})

	it("should validate multiple @Data parameters", async () => {
		const data0: MessageData = { message: "Hello World" }
		const data1: MessageData = { message: "Hello Again" }

		clientSocket.emit("data-multiple-test", data0, data1)

		await waitFor(50)

		expect(errorMiddlewareSpy).not.toHaveBeenCalled()
		expect(simpleTestFn).toHaveBeenCalledWith(data0, data1)
	})

	it("should validate all incoming data", async () => {
		const goodData: MessageData = { message: "Hello World" }
		const invalidData = { wrong: "data" }

		const event = "data-multiple-validation-test"

		clientSocket.emit(event, goodData, invalidData)

		await waitFor(50)

		expect(simpleTestFn).not.toHaveBeenCalled()
		expect(errorMiddlewareSpy).toHaveBeenCalledTimes(1)
		expect(errorMiddlewareSpy).toHaveBeenCalledWith(expect.any(SiodImcomigDataError))
	})

	it("should throw SiodImcomigDataError when dataIndex is out of bounds", async () => {
		const data: MessageData = { message: "Hello World" }
		clientSocket.emit("data-index-out-of-bounds", data)

		await waitFor(50)

		expect(simpleTestFn).not.toHaveBeenCalled()
		expect(errorMiddlewareSpy).toHaveBeenCalledTimes(1)
		expect(errorMiddlewareSpy).toHaveBeenCalledWith(expect.any(SiodImcomigDataError))
	})
})
