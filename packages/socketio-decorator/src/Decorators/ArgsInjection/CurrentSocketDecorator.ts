import { MethodArgOperations } from "../../MetadataRepository/Operations/MethodArgOperations"
import { MethodArgMetadata } from "../../MetadataRepository/MetadataObjects/MethodArgMetadata"

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

		MethodArgOperations.add(target, propertyKey, argMetadata)
	}
}