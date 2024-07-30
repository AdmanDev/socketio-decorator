import { plainToInstance } from "class-transformer"
import { getInstance } from "../../container"
import { getAllMetadata } from "../../globalMetadata"
import { SiodConfig } from "../../types/SiodConfig"
import { validate } from "class-validator"

/**
 * Adds data validation to the controller methods
 * @param {SiodConfig} config The socketio decocator configuration
 */
export function addDataValidation (config: SiodConfig) {
	if (!config.dataValidationEnabled) {
		return
	}

	const metadata = getAllMetadata()
	metadata.forEach((m) => {
		if (m.dataCheck) {
			const controllerInstance = getInstance<Any>(m.target.constructor, config.iocContainer)
			const originalMethod = controllerInstance[m.methodName]
			const paramTypes = Reflect.getMetadata("design:paramtypes", m.target, m.methodName)

			if (!paramTypes || paramTypes.length === 0) {
				return
			}

			// eslint-disable-next-line jsdoc/require-jsdoc
			controllerInstance[m.methodName] = async function (...args: Any[]) {
				const dataArgInx = args.findIndex(a => a.constructor === Object)
				if (dataArgInx >= 0) {
					const dataValue = args[dataArgInx]
					const dataType = paramTypes[dataArgInx]

					const dataInstance = plainToInstance(dataType, dataValue)
					const errors = await validate(dataInstance)
					if (errors.length > 0) {
						throw errors
					}
				}
				originalMethod.apply(controllerInstance, args)
			}
		}
	})
}