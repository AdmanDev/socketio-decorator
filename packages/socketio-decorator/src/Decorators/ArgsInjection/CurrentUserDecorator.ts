import { MethodArgOperations } from "../../MetadataRepository/Operations/MethodArgOperations"
import { MethodArgMetadata } from "../../MetadataRepository/MetadataObjects/MethodArgMetadata"

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

		MethodArgOperations.add(target, propertyKey, argMetadata)
	}
}