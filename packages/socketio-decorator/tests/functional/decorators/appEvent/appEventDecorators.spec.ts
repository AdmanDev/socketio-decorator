import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, jest } from "@jest/globals"
import { Server, Socket as ServerSocket } from "socket.io"
import { Socket as ClientSocket } from "socket.io-client"
import { AppEmit, AppEventContext, AppOn, SocketOn } from "../../../../src"
import { createServer, createSocketClient } from "../../../utilities/serverUtils"
import { waitFor } from "../../../utilities/testUtils"
import { IoCContainer } from "../../../../src/IoCContainer"
import { MessageData } from "../../../types/socketData"

describe("> AppEvent (On & Emit) decorators", () => {
	let io: Server
	let clientSocket: ClientSocket

	const onAppEmitTestSpy = jest.fn()
	const onAppEmitTestSecondSpy = jest.fn()
	const onOtherEventSpy = jest.fn()

	let appEmitTest: AppEmitTest

	class ControllerTest {
		@SocketOn("test")
		@AppEmit("app-emit-test")
		public onTest () {
			return `Hello from ${ControllerTest.name}`
		}
	}

	class AppEmitTest {
		@AppOn("app-emit-test")
		public onAppEmitTest (context: AppEventContext) {
			onAppEmitTestSpy(context)
		}

		@AppEmit("app-emit-test")
		public emitTest () {
			return `Hello from ${AppEmitTest.name}`
		}
	}

	class SecondAppEventListener {
		@AppOn("app-emit-test")
		public onAppEmitTest (context: AppEventContext) {
			onAppEmitTestSecondSpy(context)
		}

		@AppOn("other-event")
		public onOtherEvent () {
			onOtherEventSpy()
		}
	}

	beforeAll((done) => {
		io = createServer(
			{
				controllers: [ControllerTest],
				appEventListeners: [AppEmitTest, SecondAppEventListener],
			},
			{
				onServerListen: () => {
					appEmitTest = IoCContainer.getInstance<AppEmitTest>(AppEmitTest)
					done()
				},
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
		describe("> Without controller", () => {
			it("should emit the event to all listeners with same event name", async () => {
				const expectedContext: AppEventContext = {
					eventName: "app-emit-test",
					data: "Hello from AppEmitTest",
					ioContext: undefined
				}

				appEmitTest.emitTest()

				await waitFor(50)

				expect(onAppEmitTestSpy).toHaveBeenNthCalledWith(1, expectedContext)
				expect(onAppEmitTestSecondSpy).toHaveBeenNthCalledWith(1, expectedContext)
				expect(onOtherEventSpy).not.toHaveBeenCalled()
			})
		})

		describe("> With controller", () => {
			it("should emit the event to all listeners with same event name", async () => {
				const messageData: MessageData = {
					message: "A data"
				}

				const expectedContext: AppEventContext = {
					eventName: "app-emit-test",
					data: "Hello from ControllerTest",
					ioContext: {
						currentSocket: expect.any(ServerSocket) as unknown as ServerSocket,
						eventName: "test",
						eventData: [messageData]
					}
				}

				clientSocket.emit("test", messageData)

				await waitFor(50)

				expect(onAppEmitTestSpy).toHaveBeenNthCalledWith(1, expectedContext)
				expect(onAppEmitTestSecondSpy).toHaveBeenNthCalledWith(1, expectedContext)
				expect(onOtherEventSpy).not.toHaveBeenCalled()
			})
		})
	})

})
