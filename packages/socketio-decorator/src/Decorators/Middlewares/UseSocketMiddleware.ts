import { addClassSocketMiddlewareMetadata, addMethodSocketMiddlewareMetadata } from "../../globalMetadata"
import { ISocketMiddleware } from "../../Interfaces/ISocketMiddleware"
import { SiodDecoratorError } from "../../Models/Errors/SiodDecoratorError"
import { DecoratorUtils } from "../../Utils/DecoratorUtils"

/**
 * This decorator allows to specify one or more middlewares that will be executed before the event handler.
 * @param {(new() => ISocketMiddleware)[]} middlewares The middlewares to use
 * @returns {Function} The decorator
 */
export function UseSocketMiddleware (...middlewares: (new() => ISocketMiddleware)[]) {
	return function (...args: unknown[]) {
		if (DecoratorUtils.isMethodDecorator(args)) {
			const [target, propertyKey] = args
			addMethodSocketMiddlewareMetadata({
				target: target,
				methodName: propertyKey as string,
				middlewares: middlewares
			})

			return
		}

		if (DecoratorUtils.isClassDecorator(args)) {
			const [target] = args
			addClassSocketMiddlewareMetadata({
				target: target.prototype,
				middlewares: middlewares
			})

			return
		}

		throw new SiodDecoratorError(`${UseSocketMiddleware.name} decorator should be used only on methods or classes`)
	}
}