import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, jest } from "@jest/globals"
import { Server } from "socket.io"
import { Socket as ClientSocket } from "socket.io-client"
import { IErrorMiddleware, SocketOn, Throttle, SiodThrottleError } from "../../../../../src"
import { createServer, createSocketClient } from "../../../../utilities/serverUtils"
import { waitFor } from "../../../../utilities/testUtils"

describe("> Throttle scope tests", () => {
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

	class NoCustomThrottleControllerTest {
		@SocketOn("no-custom-throttle-event")
		public noCustomThrottleEvent () {
			uniqueEventFnSpy()
		}
	}

	@Throttle(3, 1000)
	class CustomClassThrottleControllerTest {

		@SocketOn("custom-class-throttle-event")
		public customThrottleEvent () {
			classEventFnSpy()
		}

		@SocketOn("custom-method-throttle-event")
		@Throttle(7, 1000)
		public customMethodThrottleEvent () {
			classEventFnSpy()
		}
	}

	beforeAll((done) => {
		io = createServer(
			{
				controllers: [NoCustomThrottleControllerTest, CustomClassThrottleControllerTest],
				errorMiddleware: ErrorMiddleware,
				throttleConfig: {
					rateLimitConfig: {
						limit: 5,
						timeWindowMs: 1000
					}
				}
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
		describe("> When a controller does not have a custom throttle", () => {
			it("should apply the global throttle to the controller methods", async () => {
				for (let i = 0; i < 7; i++) {
					clientSocket.emit("no-custom-throttle-event")
				}

				await waitFor(200)

				expect(uniqueEventFnSpy).toHaveBeenCalledTimes(5)
				expect(errorMiddlewareSpy).toHaveBeenCalledTimes(2)
				expect(errorMiddlewareSpy).toHaveBeenCalledWith(expect.any(SiodThrottleError))
			})
		})

		describe("> When a controller has a custom class throttle", () => {
			it("should apply the custom class throttle to the controller methods", async () => {
				for (let i = 0; i < 4; i++) {
					clientSocket.emit("custom-class-throttle-event")
					await waitFor(50)
				}

				await waitFor(200)

				expect(classEventFnSpy).toHaveBeenCalledTimes(3)
				expect(errorMiddlewareSpy).toHaveBeenCalledTimes(1)
				expect(errorMiddlewareSpy).toHaveBeenCalledWith(expect.any(SiodThrottleError))
			})
		})

		describe("> When a controller has a custom method throttle", () => {
			it("should apply the custom method throttle to the controller method", async () => {
				for (let i = 0; i < 8; i++) {
					clientSocket.emit("custom-method-throttle-event")
					await waitFor(50)
				}

				await waitFor(200)

				expect(classEventFnSpy).toHaveBeenCalledTimes(7)
				expect(errorMiddlewareSpy).toHaveBeenCalledTimes(1)
				expect(errorMiddlewareSpy).toHaveBeenCalledWith(expect.any(SiodThrottleError))
			})
		})
	})
})