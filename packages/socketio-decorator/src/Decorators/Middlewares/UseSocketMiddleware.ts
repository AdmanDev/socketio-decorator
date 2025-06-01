import { addSocketMiddlewareMetadata } from "../../globalMetadata"
import { ISocketMiddleware } from "../../Interfaces/ISocketMiddleware"

/**
 * This decorator allows to specify one or more middlewares that will be executed before the event handler.
 * @param {(new() => ISocketMiddleware)[]} middlewares The middlewares to use
 * @returns {Function} The decorator
 */
export function UseSocketMiddleware (...middlewares: (new() => ISocketMiddleware)[]) {
	return function (target: Object, propertyKey: string) {
		addSocketMiddlewareMetadata({
			target: target,
			methodName: propertyKey,
			middlewares: middlewares
		})
	}
}