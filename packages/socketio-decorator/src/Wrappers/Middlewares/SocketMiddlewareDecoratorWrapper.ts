import { ISocketMiddleware } from "../../Interfaces/ISocketMiddleware"
import { IoCContainer } from "../../IoCContainer"
import { EventFuncProxyType } from "../../Models/EventFuncProxyType"
import { SocketMiddlewareMetadata } from "../../Models/Metadata/MiddlewareMetadata"

/**
 * Defines a wrapper to apply socket middleware decorators.
 */
export class SocketMiddlewareDecoratorWrapper {
	/**
	 * Applies socket middleware decorators to the methods of a controller instance.
	 * @param {SocketMiddlewareMetadata[]} metadata - The metadata of the socket middleware to apply.
	 * @param {any} controllerInstance - The instance of the controller containing the methods.
	 */
	public static addSocketMiddleware (metadata: SocketMiddlewareMetadata[], controllerInstance: Any) {
		metadata.forEach((m) => {
			SocketMiddlewareDecoratorWrapper.wrapMethod(m, controllerInstance)
		})

	}

	/**
	 * Wraps a controller method with socket middleware logic.
	 * @param {SocketMiddlewareMetadata} metadata - Metadata associated with the middleware to be applied.
	 * @param {any} controllerInstance - The target controller instance containing the method to wrap.
	 */
	private static wrapMethod (metadata: SocketMiddlewareMetadata, controllerInstance: Any) {
		const methodName = metadata.methodName
		const middlewareInsances = IoCContainer.getInstances<ISocketMiddleware>(metadata.middlewares).toReversed()

		middlewareInsances.forEach((middleware) => {
			const method = controllerInstance[methodName]

			// eslint-disable-next-line jsdoc/require-jsdoc
			const socketMiddlewareProxy: EventFuncProxyType = async function (proxyArgs) {
				const methodArgs = proxyArgs.args
				const [, ...methodArgsWithoutSocket] = methodArgs

				const middlewareResult = new Promise((resolve) => {
					middleware.use([proxyArgs.eventName, ...methodArgsWithoutSocket], resolve)
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