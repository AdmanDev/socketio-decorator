import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, jest } from "@jest/globals"
import { Server } from "socket.io"
import { Socket as ClientSocket } from "socket.io-client"
import { IErrorMiddleware, SocketOn, Throttle, SiodThrottleError } from "../../../../../src"
import { createServer, createSocketClient } from "../../../../utilities/serverUtils"
import { waitFor } from "../../../../utilities/testUtils"

describe("> Throttle decorator", () => {
	let io: Server
	let clientSocket: ClientSocket

	const uniqueEventFnSpy = jest.fn()
	const classEventFnSpy = jest.fn()
	const errorMiddlewareSpy = jest.fn()

	class ErrorMiddleware implements IErrorMiddleware {
		public handleError (error: unknown) {
			errorMiddlewareSpy(error)
		}
	}

	class UniqueEventControllerTest {
		@SocketOn("unique-event")
		@Throttle(2, 1000)
		public uniqueEvent () {
			uniqueEventFnSpy()
		}
	}

	@Throttle(2, 1000)
	class ClassThrottleControllerTest {
		@SocketOn("class-event-1")
		public event1 () {
			classEventFnSpy(1)
		}

		@SocketOn("class-event-2")
		public event2 () {
			classEventFnSpy(2)
		}
	}

	beforeAll((done) => {
		io = createServer(
			{
				controllers: [UniqueEventControllerTest, ClassThrottleControllerTest],
				errorMiddleware: ErrorMiddleware,
			},
			{
				onServerListen: done,
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
		describe("> When using Throttle decorator on method", () => {
			it("Should allow requests within the limit", async () => {
				clientSocket.emit("unique-event")
				clientSocket.emit("unique-event")

				await waitFor(200)

				expect(errorMiddlewareSpy).not.toHaveBeenCalled()
				expect(uniqueEventFnSpy).toHaveBeenCalledTimes(2)
			})

			it("Should block requests exceeding the limit", async () => {
				clientSocket.emit("unique-event")
				await waitFor(50)
				clientSocket.emit("unique-event")
				await waitFor(50)
				clientSocket.emit("unique-event")

				await waitFor(200)

				expect(errorMiddlewareSpy).toHaveBeenCalledWith(expect.any(SiodThrottleError))
				expect(uniqueEventFnSpy).toHaveBeenCalledTimes(2)
			})

			it("Should reset the limit after the time window", async () => {
				clientSocket.emit("unique-event")
				clientSocket.emit("unique-event")

				await waitFor(1100)

				clientSocket.emit("unique-event")

				await waitFor(10)

				expect(errorMiddlewareSpy).not.toHaveBeenCalledWith(expect.any(SiodThrottleError))
				expect(uniqueEventFnSpy).toHaveBeenCalledTimes(3)
			})
		})

		describe("> When using Throttle decorator on class", () => {
			it("Should allow requests within the limit", async () => {
				clientSocket.emit("class-event-1")
				clientSocket.emit("class-event-1")
				clientSocket.emit("class-event-2")
				clientSocket.emit("class-event-2")

				await waitFor(200)

				expect(errorMiddlewareSpy).not.toHaveBeenCalled()
				expect(classEventFnSpy).toHaveBeenCalledTimes(4)
				expect(classEventFnSpy).toHaveBeenNthCalledWith(1, 1)
				expect(classEventFnSpy).toHaveBeenNthCalledWith(2, 1)
				expect(classEventFnSpy).toHaveBeenNthCalledWith(3, 2)
				expect(classEventFnSpy).toHaveBeenNthCalledWith(4, 2)
			})

			it.each(["class-event-1", "class-event-2"])("should block requests exceeding the limit for %s", async (eventName) => {
				clientSocket.emit(eventName)
				await waitFor(50)
				clientSocket.emit(eventName)
				await waitFor(50)
				clientSocket.emit(eventName)

				await waitFor(200)

				expect(errorMiddlewareSpy).toHaveBeenCalledTimes(1)
				expect(errorMiddlewareSpy).toHaveBeenCalledWith(expect.any(SiodThrottleError))
				expect(classEventFnSpy).toHaveBeenCalledTimes(2)
			})

			it("should block requests exceeding the limit for each event", async () => {
				clientSocket.emit("class-event-1")
				await waitFor(50)
				clientSocket.emit("class-event-1")
				await waitFor(50)
				clientSocket.emit("class-event-1")

				await waitFor(100)

				clientSocket.emit("class-event-2")
				await waitFor(50)
				clientSocket.emit("class-event-2")
				await waitFor(50)
				clientSocket.emit("class-event-2")

				await waitFor(200)

				expect(errorMiddlewareSpy).toHaveBeenCalledTimes(2)
				expect(errorMiddlewareSpy).toHaveBeenNthCalledWith(1, expect.any(SiodThrottleError))
				expect(errorMiddlewareSpy).toHaveBeenNthCalledWith(2, expect.any(SiodThrottleError))
				expect(classEventFnSpy).toHaveBeenCalledTimes(4)
				expect(classEventFnSpy).toHaveBeenNthCalledWith(1, 1)
				expect(classEventFnSpy).toHaveBeenNthCalledWith(2, 1)
				expect(classEventFnSpy).toHaveBeenNthCalledWith(3, 2)
				expect(classEventFnSpy).toHaveBeenNthCalledWith(4, 2)
			})

			it("Should reset the limit after the time window", async () => {
				clientSocket.emit("class-event-1")
				clientSocket.emit("class-event-1")
				clientSocket.emit("class-event-2")
				clientSocket.emit("class-event-2")

				await waitFor(1100)

				clientSocket.emit("class-event-1")
				clientSocket.emit("class-event-2")

				await waitFor(10)

				expect(errorMiddlewareSpy).not.toHaveBeenCalled()
				expect(classEventFnSpy).toHaveBeenCalledTimes(6)
				expect(classEventFnSpy).toHaveBeenNthCalledWith(1, 1)
				expect(classEventFnSpy).toHaveBeenNthCalledWith(2, 1)
				expect(classEventFnSpy).toHaveBeenNthCalledWith(3, 2)
				expect(classEventFnSpy).toHaveBeenNthCalledWith(4, 2)
				expect(classEventFnSpy).toHaveBeenNthCalledWith(5, 1)
				expect(classEventFnSpy).toHaveBeenNthCalledWith(6, 2)
			})

			it("Should have independent limits for class-event-1 and class-event-2", async () => {
				clientSocket.emit("class-event-1")
				await waitFor(50)
				clientSocket.emit("class-event-1")
				await waitFor(50)
				clientSocket.emit("class-event-1")

				await waitFor(100)

				clientSocket.emit("class-event-2")
				await waitFor(50)
				clientSocket.emit("class-event-2")

				await waitFor(200)

				expect(errorMiddlewareSpy).toHaveBeenCalledTimes(1)
				expect(errorMiddlewareSpy).toHaveBeenCalledWith(expect.any(SiodThrottleError))
				expect(classEventFnSpy).toHaveBeenCalledTimes(4)
				expect(classEventFnSpy).toHaveBeenNthCalledWith(1, 1)
				expect(classEventFnSpy).toHaveBeenNthCalledWith(2, 1)
				expect(classEventFnSpy).toHaveBeenNthCalledWith(3, 2)
				expect(classEventFnSpy).toHaveBeenNthCalledWith(4, 2)
			})

		})
	})
})