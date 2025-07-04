import { addMethodArgMetadata } from "../../globalMetadata"
import { SiodDecoratorError } from "../../Models/Errors/SiodDecoratorError"
import { MethodArgMetadata } from "../../Models/Metadata/MethodArgMetadata"

/**
 * Decorator to inject data from the sent message into the method argument.
 * @param {number} [dataIndex] - The index of the data argument to inject. Defaults to 0.
 * @returns {Function} A decorator function.
 */
export function Data (dataIndex = 0) {
	if (typeof dataIndex !== "number" || dataIndex < 0) {
		throw new SiodDecoratorError("Data index must be a non-negative number.")
	}

	return function (target: Object, propertyKey: string, parameterIndex: number) {
		const argMetadata: MethodArgMetadata = {
			parameterIndex,
			valueType: "data",
			dataIndex: dataIndex
		}

		addMethodArgMetadata(target, propertyKey, argMetadata)
	}
}