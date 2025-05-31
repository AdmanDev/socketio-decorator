import { ISocketMiddleware } from "../../Interfaces/ISocketMiddleware"
import { IoCContainer } from "../../IoCContainer"
import { SocketMiddlewareMetadata } from "../../Models/Metadata/MiddlewareMetadata"
import { MetadataUtils } from "../../Utils/MetadataUtils"

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
		MetadataUtils.mapMetadata(metadata, controllerInstance, (meta, method) => {
			SocketMiddlewareDecoratorWrapper.wrapMethod(meta, controllerInstance, method)
		})

	}

	/**
	 * Wraps a controller method with socket middleware logic.
	 * @param {SocketMiddlewareMetadata} metadata - Metadata associated with the middleware to be applied.
	 * @param {any} controllerInstance - The target controller instance containing the method to wrap.
	 * @param {Function} method - The original method of the controller to be wrapped with middleware.
	 */
	private static wrapMethod (metadata: SocketMiddlewareMetadata, controllerInstance: Any, method: Function) {
		const middlewareInsances = IoCContainer.getInstances<ISocketMiddleware>(metadata.middlewares)
		const methodName = metadata.methodName

		middlewareInsances.forEach((middleware) => {
			// eslint-disable-next-line jsdoc/require-jsdoc
			controllerInstance[methodName] = async function (...args: unknown[]) {
				const middlewareResult = new Promise((resolve, reject) => {
					middleware.use([eventName, ...args], (err?: Error) => {
						if (err) {
							return reject(err)
						}

						resolve(null)
					})
				})

				await middlewareResult
				return method.apply(controllerInstance, args)
			}
		})
	}
}