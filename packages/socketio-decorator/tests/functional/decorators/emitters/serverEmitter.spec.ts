import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, jest } from "@jest/globals"
import { EmitterOption, IErrorMiddleware, ServerEmitter, SiodInvalidArgumentError } from "../../../../src"
import { MessageData } from "../../../types/socketData"
import { createSocketClient, createServer } from "../../../utilities/serverUtils"
import { Server, Socket as ServerSocket } from "socket.io"
import { Socket as ClientSocket } from "socket.io-client"
import { waitFor } from "../../../utilities/testUtils"
import { IoCContainer } from "../../../../src/IoCContainer"

describe("> ServerEmitter decorator", () => {
	let io: Server
	let serverSocket: ServerSocket
	let clientSocket: ClientSocket

	const errorMiddlewareSpy = jest.fn()

	const defaultRoom = "room1"

	let controllerInstance: ServerEmitterController

	class ErrorMiddleware implements IErrorMiddleware {
		public handleError (error: unknown) {
			errorMiddlewareSpy(error)
		}
	}

	class ServerEmitterController {
		@ServerEmitter("testWithoutTarget")
		public testWithoutTarget (data: MessageData) {
			return data
		}

		@ServerEmitter("testWithDecoratorParametersMsg", defaultRoom)
		public testWithDecoratorParameters (data: MessageData) {
			return data
		}

		@ServerEmitter()
		public testWithEmitOptionObject (option: EmitterOption | EmitterOption[]) {
			return option
		}

		@ServerEmitter("testWithFalsyValueMsg", defaultRoom)
		public testWithFalsyValue (value: false | 0 | null | undefined) {
			return value
		}

		@ServerEmitter()
		public testWithEmptyEventName (data: MessageData) {
			return data
		}

		@ServerEmitter("testThrowError")
		public testThrowError () {
			throw new Error("Error from testThrowError controller")
		}
	}

	beforeAll((done) => {
		io = createServer(
			{
				controllers: [ServerEmitterController],
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

		controllerInstance = IoCContainer.getInstance<ServerEmitterController>(ServerEmitterController)
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
		it("should emit event to all client sockets when no target is specified", (done) => {
			const expectedData: MessageData = { message: "Hello" }

			clientSocket.on("testWithoutTarget", (actualData: MessageData) => {
				expect(actualData).toEqual(expectedData)
				done()
			})

			controllerInstance.testWithoutTarget(expectedData)
		})

		it("should emit event to the target specified in the decorator with the returned data", (done) => {
			const expectedData: MessageData = { message: "Hello" }

			clientSocket.on("testWithDecoratorParametersMsg", (actualData: MessageData) => {
				expect(actualData).toEqual(expectedData)
				done()
			})

			controllerInstance.testWithDecoratorParameters(expectedData)
		})

		it("should emit event from the returned EmitOption object", (done) => {
			const eventMessage = "testWithEmitOptionObjectMsg"
			const expectedData: MessageData = { message: "Hello from emit option object" }

			const option: EmitterOption = new EmitterOption({
				to: defaultRoom,
				message: eventMessage,
				data: expectedData
			})

			clientSocket.on(eventMessage, (actualData: MessageData) => {
				expect(actualData).toEqual(expectedData)
				done()
			})

			controllerInstance.testWithEmitOptionObject(option)
		})

		it("should emit multiple events from the returned EmitOption array", async () => {
			const events = ["event-1", "event-2"]
			const rooms = events.map((event) => `${event}-room`)

			rooms.forEach((room) => {
				serverSocket.join(room)
			})

			const options: EmitterOption[] = events.map((event, index) => {
				return new EmitterOption({
					to: rooms[index],
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

			controllerInstance.testWithEmitOptionObject(options)

			await Promise.race([
				assertionsPromise,
				new Promise((_, reject) => {
					setTimeout(() => {
						reject(new Error("One or more assertions was not executed"))
					}, 50 * events.length)
				})
			])
		})

		it("should emit only events that the disableEmit property is false from the returned EmitOption array", async () => {
			const options: EmitterOption[] = [
				new EmitterOption({
					to: defaultRoom,
					message: "event-1",
					data: { message: "event-1" } satisfies MessageData,
				}),
				new EmitterOption({
					to: defaultRoom,
					message: "event-2",
					data: { message: "event-2" } satisfies MessageData,
					disableEmit: true,
				})
			]

			const eventAssertions = options.map(
				(option) => new Promise<void>((resolve, reject) => {
					clientSocket.on(option.message, (actualData: MessageData) => {
						try {
							if (option.disableEmit) {
								return reject(new Error(`One of the events should not be emitted (${option.message})`))
							}

							expect(actualData).toEqual(option.data)
							resolve()
						} catch (error) {
							reject(error)
						}
					})

					setTimeout(() => {
						if (option.disableEmit) {
							resolve()
						} else {
							reject(new Error(`One of the events should be emitted (${option.message})`))
						}
					}, 50)
				})
			)

			controllerInstance.testWithEmitOptionObject(options)

			await expect(Promise.all(eventAssertions)).resolves.not.toThrow()
		})

		it("should not emit when the disableEmit property of the returned EmitOption object is true", async () => {
			const eventMessage = "testWithEmitOptionObjectMsg"
			const data: MessageData = { message: "Hello" }

			const option: EmitterOption = new EmitterOption({
				disableEmit: true,
				to: defaultRoom,
				message: eventMessage,
				data
			})

			const messageReceivedSpy = jest.fn()

			clientSocket.on(eventMessage, messageReceivedSpy)

			controllerInstance.testWithEmitOptionObject(option)

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

			controllerInstance.testWithFalsyValue(falsyValue)

			await waitFor(50)

			expect(messageReceivedSpy).not.toHaveBeenCalled()
		})

	})

	describe("> Error handling", () => {
		it(`should throw an ${SiodInvalidArgumentError.name} when event name is undefined`, async () => {
			const data: MessageData = { message: "Hello" }

			controllerInstance.testWithEmptyEventName(data)

			await waitFor(50)

			expect(errorMiddlewareSpy).toBeCalledWith(expect.any(SiodInvalidArgumentError))
		})

		it("should not emit when the controller throws an error", async () => {
			const eventMessage = "testThrowError"
			const expectedError = new Error("Error from testThrowError controller")

			const messageReceivedSpy = jest.fn()

			clientSocket.on(eventMessage, messageReceivedSpy)

			controllerInstance.testThrowError()

			await waitFor(50)

			expect(messageReceivedSpy).not.toHaveBeenCalled()
			expect(errorMiddlewareSpy).toHaveBeenCalledTimes(1)
			expect(errorMiddlewareSpy).toHaveBeenCalledWith(expectedError)
		})
	})

})