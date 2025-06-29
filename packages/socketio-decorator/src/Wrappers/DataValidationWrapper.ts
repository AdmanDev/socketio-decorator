import { ClassConstructor, plainToInstance } from "class-transformer"
import { validate } from "class-validator"
import { config } from "../globalMetadata"
import { SiodImcomigDataError } from "../Models/Errors/SiodImcomigDataError"
import { EventFuncProxyType } from "../Models/EventFuncProxyType"
import { ListenerMetadata } from "../Models/Metadata/ListenerMetadata"

/**
 * Allows to wrap a method to add data validation layer
 */
export class DataValidationWrapper {

	/**
	 * Wraps all listeners to add data validation layer
	 * @param {ListenerMetadata[]} metadata The metadata of the listeners to wrap
	 * @param {any} controllerInstance The controller instance
	 */
	public static wrapListeners (metadata: ListenerMetadata[], controllerInstance: Any) {
		if (!config.dataValidationEnabled) {
			return
		}

		metadata.forEach(m => {
			DataValidationWrapper.prepareDataValidationLayerAndWrap(m, controllerInstance)
		})
	}

	/**
	 * Prepares data validation layer and wraps listener methods
	 * @param {ListenerMetadata} listenerMetadata The listener metadata of method to wrap
	 * @param {any} controllerInstance The controller instance
	 */
	private static prepareDataValidationLayerAndWrap (listenerMetadata: ListenerMetadata, controllerInstance: Any) {
		if (listenerMetadata.dataCheck) {
			const paramTypes = Reflect.getMetadata("design:paramtypes", listenerMetadata.target, listenerMetadata.methodName)

			if (!DataValidationWrapper.isParamTypesValid(paramTypes)) {
				return
			}

			const originalMethod = controllerInstance[listenerMetadata.methodName]

			DataValidationWrapper.wrapMethod(listenerMetadata, controllerInstance, originalMethod, paramTypes)
		}
	}

	/**
	 * Determines if the paramTypes are valid for data validation
	 * @param {Function[]} paramTypes - The paramTypes of the method to wrap
	 * @returns {boolean} - Returns true if the paramTypes are valid; false otherwise
	 */
	private static isParamTypesValid (paramTypes: Function[]) {
		const dataParamIndex = paramTypes?.findIndex((p: Function) => p.name !== "Socket")
		return paramTypes && dataParamIndex >= 0
	}

	/**
	 * Wraps the method to add data validation layer
	 * @param {ListenerMetadata} listenerMetadata - The listener metadata of method to wrap
	 * @param {any} controllerInstance - The controller instance
	 * @param {Function} originalMethod - The original method of the controller
	 * @param {ClassConstructor<unknown>[]} paramTypes - The paramTypes of the method to wrap
	 */
	private static wrapMethod (
		listenerMetadata: ListenerMetadata,
		controllerInstance: Any,
		originalMethod: Function,
		paramTypes: ClassConstructor<unknown>[]
	) {
		const wrappedMethod: EventFuncProxyType = async function (proxyArgs) {
			const dataArgsMetadata = proxyArgs.methodMetadata.argsMetadata.filter(m => m.valueType === "data")

			for (const paramMetadata of dataArgsMetadata) {
				const dataValue = proxyArgs.data[paramMetadata.dataIndex]
				const dataType = paramTypes[paramMetadata.parameterIndex]

				if (!dataValue) {
					throw new SiodImcomigDataError(
						`Data for parameter (${dataType.name}) at position ${paramMetadata.parameterIndex} is undefined (dataIndex: ${paramMetadata.dataIndex})`,
					)
				}

				const dataInstance = plainToInstance(dataType, dataValue)
				const errors = await validate(dataInstance as Any)

				if (errors.length > 0) {
					let errorMessage = "Incoming data is not valid"

					if (!config.errorMiddleware) {
						errorMessage += "\n You should implement an error middleware to handle this error"
					}

					throw new SiodImcomigDataError(errorMessage, dataValue, errors)
				}
			}

			return await originalMethod.apply(controllerInstance, [proxyArgs])
		}

		controllerInstance[listenerMetadata.methodName] = wrappedMethod
	}
}
