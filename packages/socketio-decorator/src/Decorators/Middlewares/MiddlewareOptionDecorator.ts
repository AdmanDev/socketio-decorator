import { MiddlewareOptionType } from "../../Models/DecoratorOptions/MiddlewareOptionType"
import { defineReflectMiddlewareOptionMetadata } from "../../reflectLetadataFunc"

/**
 * This decorator allows to define options for a middleware class.
 * @param {MiddlewareOptionType} options The middleware options
 * @returns {Function} The decorator
 */
export function MiddlewareOption (options: MiddlewareOptionType) {
	return (target: Function) => {
		defineReflectMiddlewareOptionMetadata(target, options)
	}
}