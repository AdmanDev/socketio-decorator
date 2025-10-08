import { afterAll, beforeAll, describe, expect, it, jest } from "@jest/globals"
import { Server } from "socket.io"
import { SocketOn, useSocketIoDecorator } from "../../src"
import { MiddlewaresRegistrar } from "../../src/EventRegistrars/MiddlewaresRegistrar"
import { ConfigStore } from "../../src/MetadataRepository/Stores/ConfigStore"
import { IoCContainer } from "../../src/IoCContainer"
import { IoCProvider } from "../../src/Models/IocProvider"
import { DataValidationWrapper } from "../../src/Wrappers/DataValidationWrapper"
import { ServerEmitterWrapper } from "../../src/Wrappers/EmitterWrappers/ServerEmitterWrapper"
import { SocketEmitterWrapper } from "../../src/Wrappers/EmitterWrappers/SocketEmitterWrapper"
import { SocketMiddlewareDecoratorWrapper } from "../../src/Wrappers/Middlewares/SocketMiddlewareDecoratorWrapper"
import { expectCallOrder } from "../utilities/testUtils"
import { ThrottleWrapper } from "../../src/Wrappers/throttle/ThrottleWrapper"
import { ThrottleManager } from "../../src/Wrappers/throttle/ThrottleManager"
import { ArgsInjector } from "../../src/Wrappers/EventFuncProxy/ArgsInjector"
import { ControllerErrorWrapper } from "../../src/Wrappers/Middlewares/ErrorMiddlewares/ControllerErrorWrapper"
import { BaseErrorMiddlewareWrapper } from "../../src/Wrappers/Middlewares/ErrorMiddlewares/BaseErrorMiddlewareWrapper"
import { ArgsNormalizer } from "../../src/Wrappers/EventFuncProxy/ArgsNormalizer"
import { ListenerRegistration } from "../../src/Wrappers/ListenerRegistration"
import { IoEventsBinder } from "../../src/EventRegistrars/IoEventsBinder"

describe("> System tests", () => {
	class FirstController {

		@SocketOn("message")
		public onMessage () {
			return "Hello from controller 1"
		}
	}

	describe("> Wrapping and Bindings order tests", () => {
		const middlewareErrorMiddlewareWrapperSpy = jest.spyOn(BaseErrorMiddlewareWrapper, "wrapAllMiddlewares")
		const argsInjectorSpy = jest.spyOn(ArgsInjector.prototype, "execute")
		const dataValidationWrapperSpy = jest.spyOn(DataValidationWrapper.prototype, "execute")
		const serverEmitterWrapperSpy = jest.spyOn(ServerEmitterWrapper.prototype, "execute")
		const socketEmitterWrapperSpy = jest.spyOn(SocketEmitterWrapper.prototype, "execute")
		const socketMiddlewareMethodWrapperSpy = jest.spyOn(SocketMiddlewareDecoratorWrapper.prototype, "addMethodSocketMiddleware" as Any)
		const socketMiddlewareClassWrapperSpy = jest.spyOn(SocketMiddlewareDecoratorWrapper.prototype, "addSocketMiddlewareToManyClassMethods" as Any)
		const throttleMethodWrapperSpy = jest.spyOn(ThrottleWrapper.prototype, "addMethodThrottle" as Any)
		const throttleClassWrapperSpy = jest.spyOn(ThrottleWrapper.prototype, "addClassThrottle" as Any)
		const controllerErrorWrapperSpy = jest.spyOn(ControllerErrorWrapper.prototype, "execute")
		const argsNormalizerSpy = jest.spyOn(ArgsNormalizer.prototype, "execute")
		const listenerRegistrationSpy = jest.spyOn(ListenerRegistration.prototype, "execute")
		const middlewaresRegistrarSpy = jest.spyOn(MiddlewaresRegistrar, "registerAll")
		const ioEventsBinderSpy = jest.spyOn(IoEventsBinder, "bindAll")
		const throttlePeriodicCleanupSpy = jest.spyOn(ThrottleManager, "startPeriodicCleanup")

		it("should wrap controller methods and binds events in the correct order", async () => {
			await useSocketIoDecorator({
				controllers: [FirstController],
				ioserver: {
					on: jest.fn(),
					of: jest.fn().mockReturnThis()
				} as unknown as Server,
			})

			expectCallOrder({
				middlewareErrorMiddlewareWrapperSpy,
				argsInjectorSpy,
				dataValidationWrapperSpy,
				serverEmitterWrapperSpy,
				socketEmitterWrapperSpy,
				socketMiddlewareMethodWrapperSpy,
				socketMiddlewareClassWrapperSpy,
				throttleMethodWrapperSpy,
				throttleClassWrapperSpy,
				controllerErrorWrapperSpy,
				argsNormalizerSpy,
				listenerRegistrationSpy,
				middlewaresRegistrarSpy,
				ioEventsBinderSpy,
				throttlePeriodicCleanupSpy,
			})
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

			beforeAll(() => {
				ConfigStore.set({
					iocContainer: externalContainer
				} as Any)
			})

			afterAll(() => {
				ConfigStore.set(undefined as Any)
			})

			it("should return an instance of a service from the external container", () => {
				const firstServerMiddleware = IoCContainer.getInstance(FirstService)

				expect(firstServerMiddleware).toBeInstanceOf(FirstService)
				expect(externalContainerSpy).toHaveBeenCalledWith(FirstService)
			})

			it("should return an array of service instances of given types from the external container", () => {
				const serverMiddlewares = IoCContainer.getInstances([FirstService, SecondService])

				expect(serverMiddlewares).toBeInstanceOf(Array)
				expect(serverMiddlewares).toHaveLength(2)
				expect(serverMiddlewares[0]).toBeInstanceOf(FirstService)
				expect(serverMiddlewares[1]).toBeInstanceOf(SecondService)
				expect(externalContainerSpy).toHaveBeenCalledTimes(2)
			})
		})

	})

})