import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, jest } from "@jest/globals"
import { EmitterOption, IErrorMiddleware, SocketEmitter, SiodInvalidArgumentError, SocketOn, Data } from "../../../../src"
import { MessageData } from "../../../types/socketData"
import { createSocketClient, createServer } from "../../../utilities/serverUtils"
import { Server, Socket as ServerSocket } from "socket.io"
import { Socket as ClientSocket } from "socket.io-client"
import { waitFor } from "../../../utilities/testUtils"

describe("> SocketEmitter decorator", () => {
	let io: Server
	let serverSocket: ServerSocket
	let clientSocket: ClientSocket

	const errorMiddlewareSpy = jest.fn()

	const defaultRoom = "room1"

	class ErrorMiddleware implements IErrorMiddleware {
		public handleError (error: unknown) {
			errorMiddlewareSpy(error)
		}
	}

	class SocketEmitterController {

		@SocketOn("testWithDecoratorParameter")
		@SocketEmitter("testWithDecoratorParameterMsg")
		public async testWithDecoratorParameter (@Data() data: MessageData) {
			return data
		}

		@SocketOn("testWithEmitOption")
		@SocketEmitter()
		public testWithEmitOptionObject (@Data() data: MessageData) {
			return new EmitterOption({
				message: "testWithEmitOptionMsg",
				data
			})
		}

		@SocketOn("testWithDisableEmitOption")
		@SocketEmitter()
		public testWithDisableEmitOptionObject () {
			return new EmitterOption({
				message: "testWithDisableEmitOptionMsg",
				data: 1,
				disableEmit: true
			})
		}

		@SocketOn("testWithMultipeEventsEmitterOptons")
		@SocketEmitter()
		public testWithMultipeEventsEmitterOptons (@Data() emitterOptions: EmitterOption[]) {
			const result = emitterOptions.map((option) => new EmitterOption(option))
			return result
		}

		@SocketOn("testWithFalsyValue")
		@SocketEmitter("testWithFalsyValueMsg")
		public testWithFalsyValue (@Data() value: false | 0 | null | undefined) {
			return value
		}

		@SocketOn("testWithEmptyEventName")
		@SocketEmitter()
		public testWithEmptyEventName (@Data() data: MessageData) {
			return data
		}

		@SocketOn("testThrowError")
		@SocketEmitter("testThrowErrorMsg")
		public testThrowError () {
			throw new Error("Error from testThrowError controller")
		}
	}

	beforeAll((done) => {
		io = createServer(
			{
				controllers: [SocketEmitterController],
				errorMiddleware: ErrorMiddleware
			},
			{
				onServerListen: done,
				onServerSocketConnection: (socket) => {
					serverSocket = socket
					serverSocket.join(defaultRoom)
				}
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
		it("should emit specified event in the decorator with the returned data", (done) => {
			const expectedData: MessageData = { message: "Hello" }

			clientSocket.on("testWithDecoratorParameterMsg", (actualData: MessageData) => {
				expect(actualData).toEqual(expectedData)
				done()
			})

			clientSocket.emit("testWithDecoratorParameter", expectedData)
		})

		it("should emit event from the returned EmitOption object", (done) => {
			const expectedData: MessageData = { message: "Hello" }

			clientSocket.on("testWithEmitOptionMsg", (actualData: MessageData) => {
				expect(actualData).toEqual(expectedData)
				done()
			})

			clientSocket.emit("testWithEmitOption", expectedData)
		})

		it("should emit multiple events from the returned EmitOption array", async () => {
			const events = ["event-1", "event-2"]

			const options: EmitterOption[] = events.map((event) => {
				return new EmitterOption({
					message: event,
					data: { message: event } satisfies MessageData,
				})
			})

			const eventAssertions = events.map(
				(event, index) => new Promise<void>((resolve, reject) => {
					clientSocket.on(event, (actualData: MessageData) => {
						try {
							expect(actualData).toEqual(options[index].data)
							resolve()
						} catch (error) {
							reject(error)
						}
					})
				})
			)

			const assertionsPromise = Promise.all(eventAssertions)

			clientSocket.emit("testWithMultipeEventsEmitterOptons", options)

			await Promise.race([
				assertionsPromise,
				new Promise((_, reject) => {
					setTimeout(() => {
						reject(new Error("One or more assertions was not executed"))
					}, 50 * events.length)
				})
			])
		})

		it("should not emit when the disableEmit property of the returned EmitOption object is true", async () => {
			const eventMessage = "testWithDisableEmitOptionMsg"

			const messageReceivedSpy = jest.fn()

			clientSocket.on(eventMessage, messageReceivedSpy)

			clientSocket.emit("testWithDisableEmitOption")

			await waitFor(50)

			expect(messageReceivedSpy).not.toHaveBeenCalled()
		})

		it.each([
			{ value: false },
			{ value: 0 },
			{ value: null },
			{ value: undefined },
		])("should not emit when the returned data is falsy ($value)", async ({ value }) => {
			const falsyValue = value as false | 0 | null | undefined
			const messageReceivedSpy = jest.fn()

			clientSocket.on("testWithFalsyValueMsg", messageReceivedSpy)

			clientSocket.emit("testWithFalsyValue", falsyValue)

			await waitFor(50)

			expect(messageReceivedSpy).not.toHaveBeenCalled()
		})

	})

	describe("> Error handling", () => {
		it(`should throw an ${SiodInvalidArgumentError.name} when event name is undefined`, async () => {
			const data: MessageData = { message: "Hello" }

			clientSocket.emit("testWithEmptyEventName", data)

			await waitFor(50)

			expect(errorMiddlewareSpy).toHaveBeenCalledWith(expect.any(SiodInvalidArgumentError))
		})

		it("should not emit when the controller throws an error", async () => {
			const expectedError = new Error("Error from testThrowError controller")

			const messageReceivedSpy = jest.fn()

			clientSocket.on("testThrowErrorMsg", messageReceivedSpy)
			clientSocket.emit("testThrowError")

			await waitFor(50)

			expect(messageReceivedSpy).not.toHaveBeenCalled()
			expect(errorMiddlewareSpy).toHaveBeenCalledTimes(1)
			expect(errorMiddlewareSpy).toHaveBeenCalledWith(expectedError)
		})
	})

})