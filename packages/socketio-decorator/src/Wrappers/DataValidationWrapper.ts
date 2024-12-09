import { ClassConstructor, plainToInstance } from "class-transformer"
import { IoCContainer } from "../IoCContainer"
import { config, getListenerMetadata } from "../globalMetadata"
import { validate } from "class-validator"
import { SiodImcomigDataError } from "../Models/Errors/SiodImcomigDataError"
import { ListenerMetadata } from "../Models/Metadata/ListenerMetadata"

/**
 * Allows to wrap a method to add data validation layer
 */
export class DataValidationWrapper {

	/**
	 * Wraps all listeners to add data validation layer
	 */
	public static wrapAllListeners () {
		if (!config.dataValidationEnabled) {
			return
		}

		const metadata = getListenerMetadata()
		metadata.forEach(DataValidationWrapper.prepareDataValidationLayerAndWrap)
	}

	/**
	 * Prepares data validation layer and wraps listener methods
	 * @param {ListenerMetadata} listenerMetadata The listener metadata of method to wrap
	 */
	private static prepareDataValidationLayerAndWrap (listenerMetadata: ListenerMetadata) {
		if (listenerMetadata.dataCheck) {
			const paramTypes = Reflect.getMetadata("design:paramtypes", listenerMetadata.target, listenerMetadata.methodName)

			if (!DataValidationWrapper.isParamTypesValid(paramTypes)) {
				return
			}

			const controllerInstance = IoCContainer.getInstance<Any>(listenerMetadata.target.constructor, config.iocContainer)
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
	private static wrapMethod (listenerMetadata: ListenerMetadata, controllerInstance: Any, originalMethod: Function, paramTypes: ClassConstructor<unknown>[]) {
		// eslint-disable-next-line jsdoc/require-jsdoc
		controllerInstance[listenerMetadata.methodName] = async function (...args: Any[]) {
			const dataArgInx = args.findIndex(a => a?.constructor === Object)

			if (dataArgInx === -1) {
				throw new SiodImcomigDataError("Imcomig data object type is not valid (data validation)")
			}

			const dataValue = args[dataArgInx]
			const dataType = paramTypes[dataArgInx]

			const dataInstance = plainToInstance(dataType, dataValue)
			const errors = await validate(dataInstance as Any)

			if (errors.length > 0) {
				let errorMessage = "Imcomig data is not valid"

				if (!config.errorMiddleware) {
					errorMessage += "\n You should implement an error middleware to handle this error"
				}

				throw new SiodImcomigDataError(errorMessage, dataValue, errors)
			}

			return await originalMethod.apply(controllerInstance, args)
		}
	}
}
