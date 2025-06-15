import { addMethodArgMetadata } from "../../globalMetadata"
import { MethodArgMetadata } from "../../Models/Metadata/MethodArgMetadata"

/**
 * Injects the socket instance into a method parameter.
 * @returns {Function} The decorator function.
 */
export function CurrentSocket () {
	return (target: Object, propertyKey: string, parameterIndex: number) => {
		const argMetadata: MethodArgMetadata = {
			parameterIndex,
			valueType: "socket"
		}

		addMethodArgMetadata(target, propertyKey, argMetadata)
	}
}