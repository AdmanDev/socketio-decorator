import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, jest } from "@jest/globals"
import { Server } from "socket.io"
import { Socket as ClientSocket } from "socket.io-client"
import { Data, IErrorMiddleware, SiodImcomigDataError, SocketOn } from "../../../../src"
import { createSocketClient, createServer } from "../../../utilities/serverUtils"
import { waitFor } from "../../../utilities/testUtils"

describe("> Primitive Types Validation", () => {
	let io: Server
	let clientSocket: ClientSocket

	const testFn = jest.fn()
	const errorMiddlewareSpy = jest.fn()

	class ErrorMiddleware implements IErrorMiddleware {
		public handleError (error: unknown) {
			errorMiddlewareSpy(error)
		}
	}

	class PrimitiveTypesController {
		@SocketOn("test-string")
		public onTestString (@Data() message: string) {
			testFn(message)
		}

		@SocketOn("test-number")
		public onTestNumber (@Data() count: number) {
			testFn(count)
		}

		@SocketOn("test-boolean")
		public onTestBoolean (@Data() isActive: boolean) {
			testFn(isActive)
		}

		@SocketOn("test-multiple-primitives")
		public onTestMultiplePrimitives (@Data() str: string, @Data(1) num: number, @Data(2) bool: boolean) {
			testFn(str, num, bool)
		}
	}

	beforeAll((done) => {
		io = createServer(
			{
				controllers: [PrimitiveTypesController],
				errorMiddleware: ErrorMiddleware,
				dataValidationEnabled: true
			},
			{
				onServerListen: done
			}
		)
	})

	beforeEach((done) => {
		errorMiddlewareSpy.mockClear()
		testFn.mockClear()
		clientSocket = createSocketClient(done)
	})

	afterEach(() => {
		clientSocket?.disconnect()
	})

	afterAll(() => {
		io.close()
	})

	describe("> String validation", () => {
		it("should accept valid string", async () => {
			const validString = "Hello World"
			clientSocket.emit("test-string", validString)

			await waitFor(50)

			expect(errorMiddlewareSpy).not.toHaveBeenCalled()
			expect(testFn).toHaveBeenCalledWith(validString)
		})

		it("should reject other types instead of string", async () => {
			const invalidData = 123
			clientSocket.emit("test-string", invalidData)

			await waitFor(50)

			expect(testFn).not.toHaveBeenCalled()
			expect(errorMiddlewareSpy).toHaveBeenCalledTimes(1)
			expect(errorMiddlewareSpy).toHaveBeenCalledWith(expect.any(SiodImcomigDataError))
		})

		it("should reject object instead of string", async () => {
			const invalidData = { value: "test" }
			clientSocket.emit("test-string", invalidData)

			await waitFor(50)

			expect(testFn).not.toHaveBeenCalled()
			expect(errorMiddlewareSpy).toHaveBeenCalledTimes(1)
			expect(errorMiddlewareSpy).toHaveBeenCalledWith(expect.any(SiodImcomigDataError))
		})
	})

	describe("> Number validation", () => {
		it("should accept valid number", async () => {
			const validNumber = 42
			clientSocket.emit("test-number", validNumber)

			await waitFor(50)

			expect(errorMiddlewareSpy).not.toHaveBeenCalled()
			expect(testFn).toHaveBeenCalledWith(validNumber)
		})

		it("should accept zero", async () => {
			const validNumber = 0
			clientSocket.emit("test-number", validNumber)

			await waitFor(50)

			expect(errorMiddlewareSpy).not.toHaveBeenCalled()
			expect(testFn).toHaveBeenCalledWith(validNumber)
		})

		it("should accept negative number", async () => {
			const validNumber = -10
			clientSocket.emit("test-number", validNumber)

			await waitFor(50)

			expect(errorMiddlewareSpy).not.toHaveBeenCalled()
			expect(testFn).toHaveBeenCalledWith(validNumber)
		})

		it("should accept floating point number", async () => {
			const validNumber = 3.14
			clientSocket.emit("test-number", validNumber)

			await waitFor(50)

			expect(errorMiddlewareSpy).not.toHaveBeenCalled()
			expect(testFn).toHaveBeenCalledWith(validNumber)
		})

		it("should reject other types instead of number", async () => {
			const invalidData = "123"
			clientSocket.emit("test-number", invalidData)

			await waitFor(50)

			expect(testFn).not.toHaveBeenCalled()
			expect(errorMiddlewareSpy).toHaveBeenCalledTimes(1)
			expect(errorMiddlewareSpy).toHaveBeenCalledWith(expect.any(SiodImcomigDataError))
		})

		it("should reject NaN", async () => {
			const invalidData = NaN
			clientSocket.emit("test-number", invalidData)

			await waitFor(50)

			expect(testFn).not.toHaveBeenCalled()
			expect(errorMiddlewareSpy).toHaveBeenCalledTimes(1)
			expect(errorMiddlewareSpy).toHaveBeenCalledWith(expect.any(SiodImcomigDataError))
		})
	})

	describe("> Boolean validation", () => {
		it("should accept true", async () => {
			const validBoolean = true
			clientSocket.emit("test-boolean", validBoolean)

			await waitFor(50)

			expect(errorMiddlewareSpy).not.toHaveBeenCalled()
			expect(testFn).toHaveBeenCalledWith(validBoolean)
		})

		it("should accept false", async () => {
			const validBoolean = false
			clientSocket.emit("test-boolean", validBoolean)

			await waitFor(50)

			expect(errorMiddlewareSpy).not.toHaveBeenCalled()
			expect(testFn).toHaveBeenCalledWith(validBoolean)
		})

		it("should reject other types instead of boolean", async () => {
			const invalidData = "true"
			clientSocket.emit("test-boolean", invalidData)

			await waitFor(50)

			expect(testFn).not.toHaveBeenCalled()
			expect(errorMiddlewareSpy).toHaveBeenCalledTimes(1)
			expect(errorMiddlewareSpy).toHaveBeenCalledWith(expect.any(SiodImcomigDataError))
		})

		it("should reject number instead of boolean", async () => {
			const invalidData = 1
			clientSocket.emit("test-boolean", invalidData)

			await waitFor(50)

			expect(testFn).not.toHaveBeenCalled()
			expect(errorMiddlewareSpy).toHaveBeenCalledTimes(1)
			expect(errorMiddlewareSpy).toHaveBeenCalledWith(expect.any(SiodImcomigDataError))
		})
	})

	describe("> Multiple primitives validation", () => {
		it("should accept all valid primitives", async () => {
			const str = "test"
			const num = 123
			const bool = true

			clientSocket.emit("test-multiple-primitives", str, num, bool)

			await waitFor(50)

			expect(errorMiddlewareSpy).not.toHaveBeenCalled()
			expect(testFn).toHaveBeenCalledWith(str, num, bool)
		})

		it("should reject if any primitive is invalid", async () => {
			const str = "test"
			const invalidNum = "not a number"
			const bool = true

			clientSocket.emit("test-multiple-primitives", str, invalidNum, bool)

			await waitFor(50)

			expect(testFn).not.toHaveBeenCalled()
			expect(errorMiddlewareSpy).toHaveBeenCalledTimes(1)
			expect(errorMiddlewareSpy).toHaveBeenCalledWith(expect.any(SiodImcomigDataError))
		})
	})
})
