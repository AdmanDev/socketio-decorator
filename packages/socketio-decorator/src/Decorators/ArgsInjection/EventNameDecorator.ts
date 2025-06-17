import { addMethodArgMetadata } from "../../globalMetadata"
import { MethodArgMetadata } from "../../Models/Metadata/MethodArgMetadata"

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

		addMethodArgMetadata(target, propertyKey, argMetadata)
	}
}
