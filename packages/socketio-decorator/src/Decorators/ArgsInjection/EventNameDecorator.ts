import { MethodArgOperations } from "../../MetadataRepository/Operations/MethodArgOperations"
import { MethodArgMetadata } from "../../MetadataRepository/MetadataObjects/MethodArgMetadata"

/**
 * Decorator to inject the event name into a method parameter.
 * @returns {Function} The decorator function.
 */
export function EventName () {
	return (target: Object, propertyKey: string, parameterIndex: number) => {
		const argMetadata: MethodArgMetadata = {
			parameterIndex,
			valueType: "eventName"
		}

		MethodArgOperations.add(target, propertyKey, argMetadata)
	}
}
