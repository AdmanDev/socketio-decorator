import { MethodMetadata } from "../MetadataObjects/Metadata"
import { defineReflectMethodMetadata } from "../../reflectMetadataFunc"
import { ControllerMetadataStore } from "./ControllerMetadataStore"

/**
 * Store for managing method metadata
 */
export class MethodMetadataStore {
	/**
	 * Gets or creates the method metadata for a given target and method name
	 * @param {object} target The target object
	 * @param {string} methodName The name of the method
	 * @returns {MethodMetadata} The method metadata for the target and method name
	 */
	public static getOrCreate (target: Object, methodName: string): MethodMetadata {
		const controllerMetadata = ControllerMetadataStore.getOrCreate(target)
		const methodMetadata = controllerMetadata.methodMetadata.find((m) => m.methodName === methodName)

		if (!methodMetadata) {
			const newMethodMetadata: MethodMetadata = {
				methodName,
				metadata: {
					ioMetadata: {
						listenerMetadata: [],
						emitterMetadata: []
					},
					socketMiddlewareMetadata: []
				},
				argsMetadata: []
			}

			controllerMetadata.methodMetadata.push(newMethodMetadata)

			defineReflectMethodMetadata(target, newMethodMetadata)

			return newMethodMetadata
		}

		return methodMetadata
	}
}
