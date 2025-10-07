import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, jest } from "@jest/globals"
import { Server, Socket as ServerSocket } from "socket.io"
import { Socket as ClientSocket } from "socket.io-client"
import { CurrentSocket, CurrentUser, IErrorMiddleware, SocketOn } from "../../../../src"
import { config } from "../../../../src/globalMetadata"
import { createServer, createSocketClient } from "../../../utilities/serverUtils"

describe("> CurrentUser Decorator", () => {
	let io: Server
	let clientSocket: ClientSocket

	const simpleTestFn = jest.fn()

	type User = {
		id: string
		name: string
	}

	class ErrorMiddleware implements IErrorMiddleware {
		public handleError (error: Error, socket?: ServerSocket): void {
			socket?.emit("error", error.message)
		}
	}

	class ControllerTest {
		@SocketOn("simple-test")
		public onSimpleTest (@CurrentSocket() socket: ServerSocket, @CurrentUser() user: User) {
			simpleTestFn(user)
			socket.emit("simple-test-resp")
		}
	}

	beforeAll((done) => {
		io = createServer(
			{
				controllers: [ControllerTest],
				errorMiddleware: ErrorMiddleware,
				currentUserProvider: async (socket: ServerSocket) => {
					const user: User = {
						id: socket.id,
						name: "Test User"
					}

					return Promise.resolve(user)
				}
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
		it("should inject user into the method parameter", (done) => {
			clientSocket.on("simple-test-resp", () => {
				const user: User = {
					id: clientSocket.id!,
					name: "Test User"
				}

				expect(simpleTestFn).toHaveBeenCalledWith(user)
				done()
			})

			clientSocket.emit("simple-test")
		})

		describe("when the currentUserProvider is not defined", () => {
			let originalProvider: typeof config.currentUserProvider

			beforeAll(() => {
				originalProvider = config.currentUserProvider
				config.currentUserProvider = undefined
			})

			afterAll(() => {
				config.currentUserProvider = originalProvider
			})

			it("should throw an error when the currentUserProvider is not defined", (done) => {
				clientSocket.emit("simple-test")
				clientSocket.on("error", (error) => {
					expect(error).toBe("To use @CurrentUser decorator, you must provide a currentUserProvider in the config.")
					done()
				})
			})
		})
	})
})