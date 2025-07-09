import { ISocketMiddleware } from "../../Interfaces/ISocketMiddleware"
import { IoCContainer } from "../../IoCContainer"
import { EventFuncProxyType } from "../../Models/EventFuncProxyType"
import { ControllerMetadata } from "../../Models/Metadata/Metadata"
import { SocketMiddlewareMetadata } from "../../Models/Metadata/MiddlewareMetadata"

/**
 * Defines a wrapper to apply socket middleware decorators.
 */
export class SocketMiddlewareDecoratorWrapper {
	/**
	 * Applies methods socket middleware decorators to the methods of a controller instance.
	 * @param {SocketMiddlewareMetadata[]} metadata - The metadata of the socket middleware to apply.
	 * @param {any} controllerInstance - The instance of the controller containing the methods.
	 */
	public static addMethodSocketMiddleware (metadata: SocketMiddlewareMetadata[], controllerInstance: Any) {
		metadata.forEach((m) => {
			SocketMiddlewareDecoratorWrapper.wrapMethod(m, controllerInstance)
		})
	}

	/**
	 * Applies class socket middleware decorators to all methods of a controller class.
	 * @param {ControllerMetadata} metadata - The metadata of the controller class containing the methods.
	 */
	public static addSocketMiddlewareToManyClassMethods (metadata: ControllerMetadata) {
		const { controllerInstance, methodMetadata, middlewaresMetadata } = metadata

		const methodNames: string[] = methodMetadata
			.filter(method => {
				const listeners = method.metadata.ioMetadata.listenerMetadata
				return listeners.length > 0 && !listeners.some(lm => lm.type === "server")
			})
			.map(method => method.metadata.ioMetadata.listenerMetadata[0].methodName)

		if (methodNames.length === 0) {
			return
		}

		const socketMiddlewareMetadata: SocketMiddlewareMetadata[] = middlewaresMetadata.flatMap(
			classMiddleware => methodNames.map(methodName => ({
				target: classMiddleware.target,
				middlewares: classMiddleware.middlewares,
				methodName,
			}))
		)

		SocketMiddlewareDecoratorWrapper.addMethodSocketMiddleware(socketMiddlewareMetadata, controllerInstance)
	}

	/**
	 * Wraps a controller method with socket middleware logic.
	 * @param {SocketMiddlewareMetadata} metadata - Metadata associated with the middleware to be applied.
	 * @param {any} controllerInstance - The target controller instance containing the method to wrap.
	 */
	private static wrapMethod (metadata: SocketMiddlewareMetadata, controllerInstance: Any) {
		const methodName = metadata.methodName
		const middlewareInstances = IoCContainer.getInstances<ISocketMiddleware>(metadata.middlewares).reverse()

		middlewareInstances.forEach((middleware) => {
			const method = controllerInstance[methodName]

			const socketMiddlewareProxy: EventFuncProxyType = async function (proxyArgs) {
				const middlewareResult = new Promise((resolve) => {
					middleware.use(proxyArgs.socket!, [proxyArgs.eventName, ...proxyArgs.data], resolve)
				})

				const error = await middlewareResult

				if (error) {
					return
				}

				return method.apply(controllerInstance, [proxyArgs])
			}

			controllerInstance[methodName] = socketMiddlewareProxy
		})
	}
}