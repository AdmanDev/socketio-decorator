import { MethodArgOperations } from "../../MetadataRepository/Operations/MethodArgOperations"
import { MethodArgMetadata } from "../../MetadataRepository/MetadataObjects/MethodArgMetadata"

/**
 * Injects, into the specified parameter, a socket data attribute by key or entire data store if no key is provided.
 * @param {string | undefined} dataKey - The key of the data to inject.
 * @returns {Function} The decorator function.
 */
export function SocketData (dataKey?: string) {
	return (target: Object, propertyKey: string, parameterIndex: number) => {
		const argMetadata: MethodArgMetadata = {
			valueType: "socketDataAttribute",
			parameterIndex,
			dataKey,
		}

		MethodArgOperations.add(target, propertyKey, argMetadata)
	}
}