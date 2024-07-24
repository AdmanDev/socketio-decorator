import { addMetadata } from "../globalMetadata"

/**
 * Regiser a method as a socket event listener for the given event
 * @param {string} event The event to listen for
 * @returns {Function} The decorator function
 */
export function SocketOn (event: string) {
	return function (target: Object, propertyKey: string) {
		addMetadata({
			type: "socket",
			target: target.constructor,
			methodName: propertyKey,
			eventName: event
		})
	}
}