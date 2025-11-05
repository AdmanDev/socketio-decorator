import { AppEventOperations } from "../../MetadataRepository/Operations/AppEventOperations"

/**
 * Decorator to emit an application event
 * @param {string} eventName The name of the event to emit
 * @returns {MethodDecorator} The decorator function
 */
export function AppEmit (eventName: string) {
	return function (target: Object, propertyKey: string | symbol) {
		AppEventOperations.add(
			target,
			propertyKey as string,
			eventName
		)
	}
}