import { addClassThrottleMetadata, addMethodThrottleMetadata } from "../../globalMetadata"
import { SiodDecoratorError } from "../../Models/Errors/SiodDecoratorError"
import { DecoratorUtils } from "../../Utils/DecoratorUtils"

/**
 * Throttle decorator to limit the number of requests to a method
 * @param {number} limit The maximum number of requests allowed within the time window
 * @param {number} timeWindowMs The time window in milliseconds
 * @returns {Function} The decorator
 */
export function Throttle (limit: number, timeWindowMs: number) {
	return function (...args: unknown[]) {
		if (DecoratorUtils.isMethodDecorator(args)) {
			const [target, propertyKey] = args
			addMethodThrottleMetadata({
				target: target,
				methodName: propertyKey as string,
				limit,
				timeWindowMs
			})
			return
		}

		if (DecoratorUtils.isClassDecorator(args)) {
			const [target] = args
			addClassThrottleMetadata({
				target: target.prototype,
				limit,
				timeWindowMs
			})
			return
		}

		throw new SiodDecoratorError(`${Throttle.name} decorator should be used only on methods or classes`)
	}
}