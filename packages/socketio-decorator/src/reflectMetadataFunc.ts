import { MiddlewareOptionType } from "./Models/DecoratorOptions/MiddlewareOptionType"
import { MethodMetadata } from "./MetadataRepository/MetadataObjects/Metadata"

const METHOD_METADATA_KEY = "siod:method-metadata"
const MIDDLEWARE_OPTION_KEY = "siod:middleware-option"

/**
 * Defines the method metadata for a event method handler.
 * @param {object} target - The target object.
 * @param {MethodMetadata} methodMetadata - The metadata of the method.
 */
export function defineReflectMethodMetadata (target: Object, methodMetadata: MethodMetadata) {
	Reflect.defineMetadata(METHOD_METADATA_KEY, methodMetadata, target, methodMetadata.methodName)
}

/**
 * Gets the method metadata for a event method handler.
 * @param {object} target - The target object.
 * @param {string} methodName - The name of the method.
 * @returns {MethodMetadata | undefined} The metadata of the method, or undefined if none.
 */
export function getReflectMethodMetadata (target: Object, methodName: string) {
	return Reflect.getMetadata(METHOD_METADATA_KEY, target, methodName) as MethodMetadata | undefined
}

/**
 * Defines the middleware option metadata for a middleware class.
 * @param {Function} target - The target class.
 * @param {MiddlewareOptionType} option - The middleware option.
 */
export function defineReflectMiddlewareOptionMetadata (target: Function, option: MiddlewareOptionType) {
	Reflect.defineMetadata(MIDDLEWARE_OPTION_KEY, option, target)
}

/**
 * Gets the middleware option metadata for a middleware class.
 * @param {Function} target - The target class.
 * @returns {MiddlewareOptionType | undefined} The middleware option, or undefined if none.
 */
export function getReflectMiddlewareOptionMetadata (target: Function) {
	return Reflect.getMetadata(MIDDLEWARE_OPTION_KEY, target) as MiddlewareOptionType | undefined
}