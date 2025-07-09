import { addMethodArgMetadata } from "../../globalMetadata"
import { MethodArgMetadata } from "../../Models/Metadata/MethodArgMetadata"

/**
 * Injects the current user instance into a method parameter.
 * @returns {Function} The decorator function.
 */
export function CurrentUser () {
	return (target: Object, propertyKey: string, parameterIndex: number) => {
		const argMetadata: MethodArgMetadata = {
			parameterIndex,
			valueType: "currentUser"
		}

		addMethodArgMetadata(target, propertyKey, argMetadata)
	}
}