import { afterAll, afterEach, describe, expect, it, jest } from "@jest/globals"
import { Server } from "socket.io"
import { Socket as ClientSocket } from "socket.io-client"
import { ListenersRegistrar } from "../../src/EventRegistrars/ListenersRegistrar"
import { MiddlewaresRegistrar } from "../../src/EventRegistrars/MiddlewaresRegistrar"
import { IoCContainer } from "../../src/IoCContainer"
import { IoCProvider } from "../../src/Models/IocProvider"
import { DataValidationWrapper } from "../../src/Wrappers/DataValidationWrapper"
import { ServerEmitterWrapper } from "../../src/Wrappers/EmitterWrappers/ServerEmitterWrapper"
import { SocketEmitterWrapper } from "../../src/Wrappers/EmitterWrappers/SocketEmitterWrapper"
import { ErrorMiddlewareWrapper } from "../../src/Wrappers/ErrorMiddlewareWrapper"
import { createServer } from "../utilities/serverUtils"

describe("> System tests", () => {
	let io: Server
	let clientSocket: ClientSocket

	afterEach(() => {
		clientSocket?.disconnect()
	})

	afterAll(() => {
		io?.close()
	})

	describe("> Wrapping and Bindings order tests", () => {
		const dataValidationWrapperSpy = jest.spyOn(DataValidationWrapper, "wrapAllListeners")
		const serverEmitterWrapperSpy = jest.spyOn(ServerEmitterWrapper, "wrapAllEmitters")
		const socketEmitterWrapperSpy = jest.spyOn(SocketEmitterWrapper, "wrapAllEmitters")
		const errorMiddlewareWrapperSpy = jest.spyOn(ErrorMiddlewareWrapper, "wrapAllControllersAndMiddlewares")
		const middlewaresRegistrarSpy = jest.spyOn(MiddlewaresRegistrar, "registerAll")
		const listenersRegistrarSpy = jest.spyOn(ListenersRegistrar, "registerListeners")
		const groupedEventsRegistrationSpy = jest.spyOn(ListenersRegistrar, "applyGroupedSocketEventsRegistration")

		it("should wrap controller methods and binds events in the correct order", () => {
			io = createServer(
				{
					controllers: [],
				},
				{}
			)

			const dataValidationCallOrder = dataValidationWrapperSpy.mock.invocationCallOrder[0]
			const serverEmitterCallOrder = serverEmitterWrapperSpy.mock.invocationCallOrder[0]
			const socketEmitterCallOrder = socketEmitterWrapperSpy.mock.invocationCallOrder[0]
			const errorMiddlewareCallOrder = errorMiddlewareWrapperSpy.mock.invocationCallOrder[0]
			const middlewaresRegistrarCallOrder = middlewaresRegistrarSpy.mock.invocationCallOrder[0]
			const listenersRegistrarCallOrder = listenersRegistrarSpy.mock.invocationCallOrder[0]
			const groupedEventsRegistrationCallOrder = groupedEventsRegistrationSpy.mock.invocationCallOrder[0]

			expect(dataValidationCallOrder).toBeLessThan(serverEmitterCallOrder)
			expect(serverEmitterCallOrder).toBeLessThan(socketEmitterCallOrder)
			expect(socketEmitterCallOrder).toBeLessThan(errorMiddlewareCallOrder)
			expect(errorMiddlewareCallOrder).toBeLessThan(middlewaresRegistrarCallOrder)
			expect(middlewaresRegistrarCallOrder).toBeLessThan(listenersRegistrarCallOrder)
			expect(listenersRegistrarCallOrder).toBeLessThan(groupedEventsRegistrationCallOrder)
		})
	})

	describe("> Inversion of Control tests", () => {
		class FirstService {}

		class SecondService {}

		describe("> Default IoC container tests", () => {
			describe("> get(ONE)Instance  tests", () => {
				it("should return an instance of a service", () => {
					const firstServerMiddleware = IoCContainer.getInstance(FirstService)
					expect(firstServerMiddleware).toBeInstanceOf(FirstService)
				})

				it("should always return the same instance of a service", () => {
					const firstServerMiddleware1 = IoCContainer.getInstance(FirstService)
					const firstServerMiddleware2 = IoCContainer.getInstance(FirstService)

					expect(firstServerMiddleware1).toBe(firstServerMiddleware2)
				})

				it("should return different instances of different services", () => {
					const firstServerMiddleware = IoCContainer.getInstance(FirstService)
					const secondServerMiddleware = IoCContainer.getInstance(SecondService)

					expect(firstServerMiddleware).not.toBe(secondServerMiddleware)
				})
			})

			describe("> get(MANY)Instances tests", () => {
				it("should return an array of service instances of given types", () => {
					const serverMiddlewares = IoCContainer.getInstances([FirstService, SecondService])

					expect(serverMiddlewares).toBeInstanceOf(Array)
					expect(serverMiddlewares).toHaveLength(2)
					expect(serverMiddlewares[0]).toBeInstanceOf(FirstService)
					expect(serverMiddlewares[1]).toBeInstanceOf(SecondService)
				})
			})
		})

		describe("> External IoC container tests", () => {
			const externalContainerSpy = jest.fn()
			const externalContainer: IoCProvider = {
				get: (type) => {
					externalContainerSpy(type)
					return new type()
				}
			}

			it("should return an instance of a service from the external container", () => {
				const firstServerMiddleware = IoCContainer.getInstance(FirstService, externalContainer)

				expect(firstServerMiddleware).toBeInstanceOf(FirstService)
				expect(externalContainerSpy).toHaveBeenCalledWith(FirstService)
			})

			it("should return an array of service instances of given types from the external container", () => {
				const serverMiddlewares = IoCContainer.getInstances([FirstService, SecondService], externalContainer)

				expect(serverMiddlewares).toBeInstanceOf(Array)
				expect(serverMiddlewares).toHaveLength(2)
				expect(serverMiddlewares[0]).toBeInstanceOf(FirstService)
				expect(serverMiddlewares[1]).toBeInstanceOf(SecondService)
				expect(externalContainerSpy).toHaveBeenCalledTimes(2)
			})
		})

	})

})