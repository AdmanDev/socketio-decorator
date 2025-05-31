import { TreeMethodMetadata } from "./Models/Metadata/Metadata"

const METHOD_METADATA_KEY = "siod:method-metadata"

/**
 * Defines the method metadata for a event method handler.
 * @param {object} target - The target object.
 * @param {TreeMethodMetadata} methodMetadata - The metadata of the method.
 */
export function defineReflectMethodMetadata (target: Object, methodMetadata: TreeMethodMetadata) {
	Reflect.defineMetadata(METHOD_METADATA_KEY, methodMetadata, target, methodMetadata.methodName)
}

/**
 * Gets the method metadata for a event method handler.
 * @param {object} target - The target object.
 * @param {string} methodName - The name of the method.
 * @returns {TreeMethodMetadata | undefined} The metadata of the method, or undefined if none.
 */
export function getReflectMethodMetadata (target: Object, methodName: string) {
	return Reflect.getMetadata(METHOD_METADATA_KEY, target, methodName) as TreeMethodMetadata | undefined
}