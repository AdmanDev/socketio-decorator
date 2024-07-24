import { addMetadata } from "../globalMetadata"

/**
 * Regiser a method as a server event listener for the given event
 * @param {string} event The event to listen for
 * @returns {Function} The decorator function
 */
export function ServerOn (event: string) {
	return function (target: Object, propertyKey: string) {
		addMetadata({
			type: "server",
			target: target.constructor,
			methodName: propertyKey,
			eventName: event
		})
	}
}