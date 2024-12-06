import { plainToInstance } from "class-transformer"
import { getInstance } from "../../container"
import { getListenerMetadata } from "../../globalMetadata"
import { SiodConfig } from "../../types/SiodConfig"
import { validate } from "class-validator"
import { SiodImcomigDataError } from "../../types/errors/SiodImcomigDataError"

/**
 * Adds data validation to the controller methods
 * @param {SiodConfig} config The socketio decocator configuration
 */
export function addDataValidation (config: SiodConfig) {
	if (!config.dataValidationEnabled) {
		return
	}

	const metadata = getListenerMetadata()
	metadata.forEach((m) => {
		if (m.dataCheck) {
			const paramTypes = Reflect.getMetadata("design:paramtypes", m.target, m.methodName)

			const dataParamIndex = paramTypes?.findIndex((p: Function) => p.name !== "Socket")

			if (!paramTypes || dataParamIndex === -1) {
				return
			}

			const controllerInstance = getInstance<Any>(m.target.constructor, config.iocContainer)
			const originalMethod = controllerInstance[m.methodName]

			// eslint-disable-next-line jsdoc/require-jsdoc
			controllerInstance[m.methodName] = async function (...args: Any[]) {
				const dataArgInx = args.findIndex(a => a?.constructor === Object)
				if (dataArgInx === -1) {
					throw new SiodImcomigDataError("Imcomig data object type is not valid (data validation)")
				}

				const dataValue = args[dataArgInx]
				const dataType = paramTypes[dataArgInx]

				const dataInstance = plainToInstance(dataType, dataValue)
				const errors = await validate(dataInstance)
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
	})
}