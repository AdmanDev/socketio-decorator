import { ClassConstructor, plainToInstance } from "class-transformer"
import { validate } from "class-validator"
import { ConfigStore } from "../MetadataRepository/Stores/ConfigStore"
import { SiodIncomingDataError } from "../Models/Errors/SiodIncomingDataError"
import { EventFuncProxyType } from "../Models/EventFuncProxyType"
import { ListenerMetadata } from "../MetadataRepository/MetadataObjects/ListenerMetadata"
import { ControllerWrapper } from "./WrapperCore/ControllerWrapper/ControllerWrapper"
import { ControllerMetadata } from "../MetadataRepository/MetadataObjects/Metadata"
import { ControllerInstance } from "../Models/Utilities/ControllerTypes"

/**
 * Allows to wrap a method to add data validation layer
 */
export class DataValidationWrapper extends ControllerWrapper {
	/** @inheritdoc */
	public execute (metadata: ControllerMetadata) {
		if (!ConfigStore.get().dataValidationEnabled) {
			return
		}

		const { controllerInstance, methodMetadata } = metadata
		const listeners = methodMetadata.flatMap(m => m.metadata.ioMetadata.listenerMetadata)

		listeners.forEach(m => {
			this.prepareDataValidationLayerAndWrap(m, controllerInstance!)
		})
	}

	/**
	 * Prepares data validation layer and wraps listener methods
	 * @param {ListenerMetadata} listenerMetadata The listener metadata of method to wrap
	 * @param {ControllerInstance} controllerInstance The controller instance
	 */
	private prepareDataValidationLayerAndWrap (listenerMetadata: ListenerMetadata, controllerInstance: ControllerInstance) {
		if (listenerMetadata.dataCheck) {
			const paramTypes = Reflect.getMetadata("design:paramtypes", listenerMetadata.target, listenerMetadata.methodName)

			if (!this.isParamTypesValid(paramTypes)) {
				return
			}

			const originalMethod = controllerInstance[listenerMetadata.methodName]

			this.wrapMethod(listenerMetadata, controllerInstance, originalMethod as Function, paramTypes)
		}
	}

	/**
	 * Determines if the paramTypes are valid for data validation
	 * @param {Function[]} paramTypes - The paramTypes of the method to wrap
	 * @returns {boolean} - Returns true if the paramTypes are valid; false otherwise
	 */
	private isParamTypesValid (paramTypes: Function[]) {
		const dataParamIndex = paramTypes?.findIndex((p: Function) => p.name !== "Socket")
		return paramTypes && dataParamIndex >= 0
	}

	/**
	 * Wraps the method to add data validation layer
	 * @param {ListenerMetadata} listenerMetadata - The listener metadata of method to wrap
	 * @param {ControllerInstance} controllerInstance - The controller instance
	 * @param {Function} originalMethod - The original method of the controller
	 * @param {ClassConstructor<unknown>[]} paramTypes - The paramTypes of the method to wrap
	 */
	private wrapMethod (
		listenerMetadata: ListenerMetadata,
		controllerInstance: ControllerInstance,
		originalMethod: Function,
		paramTypes: ClassConstructor<unknown>[]
	) {
		const wrappedMethod: EventFuncProxyType = async (proxyArgs) => {
			const dataArgsMetadata = proxyArgs.methodMetadata.argsMetadata.filter(m => m.valueType === "data")

			for (const paramMetadata of dataArgsMetadata) {
				const dataValue = proxyArgs.data[paramMetadata.dataIndex]
				const dataType = paramTypes[paramMetadata.parameterIndex]

				if (dataValue === undefined || dataValue === null) {
					throw new SiodIncomingDataError(
						`Data for parameter (${dataType.name}) at position ${paramMetadata.parameterIndex} is undefined (dataIndex: ${paramMetadata.dataIndex})`,
					)
				}

				if (this.isPrimitiveType(dataType)) {
					this.validatePrimitiveType(
						dataValue,
						dataType,
						paramMetadata.parameterIndex,
						paramMetadata.dataIndex
					)
				} else {
					await this.validateObjectType(dataType, dataValue)
				}
			}

			return await originalMethod.apply(controllerInstance, [proxyArgs])
		}

		controllerInstance[listenerMetadata.methodName] = wrappedMethod
	}

	/**
	 * Validates an object type value
	 * @param {ClassConstructor<unknown>} dataType - The expected object type
	 * @param {unknown} dataValue - The value to validate
	 */
	private async validateObjectType (dataType: ClassConstructor<unknown>, dataValue: unknown) {
		const dataInstance = plainToInstance(dataType, dataValue)
		const errors = await validate(dataInstance as Object)

		if (errors.length > 0) {
			let errorMessage = "Incoming data is not valid"

			if (!ConfigStore.get().errorMiddleware) {
				errorMessage += "\n You should implement an error middleware to handle this error"
			}

			throw new SiodIncomingDataError(errorMessage, dataValue, errors)
		}
	}

	/**
	 * Checks if the given type is a primitive type
	 * @param {Function} type - The type to check
	 * @returns {boolean} - True if the type is a primitive type; false otherwise
	 */
	private isPrimitiveType (type: Function): boolean {
		return type === String || type === Number || type === Boolean
	}

	/**
	 * Validates a primitive type value
	 * @param {unknown} value - The value to validate
	 * @param {Function} expectedType - The expected primitive type
	 * @param {number} parameterIndex - The parameter index for error reporting
	 * @param {number} dataIndex - The data index for error reporting
	 */
	private validatePrimitiveType (value: unknown, expectedType: Function, parameterIndex: number, dataIndex: number) {
		const actualType = typeof value
		const expectedTypeName = expectedType.name.toLowerCase()
		const isValid = actualType === expectedTypeName

		if (!isValid) {
			throw new SiodIncomingDataError(
				`Incoming data is not valid. Invalid type for parameter at position ${parameterIndex}. Expected ${expectedTypeName}, but received ${actualType} (dataIndex: ${dataIndex})`,
			)
		}
	}
}
