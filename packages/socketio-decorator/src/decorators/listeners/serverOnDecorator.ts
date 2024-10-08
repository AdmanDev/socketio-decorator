import { addListenerMetadata } from "../../globalMetadata"

/**
 * Regiser a method as "io.on" event listener for the given event
 * @param {string} event The event to listen for
 * @returns {Function} The decorator function
 */
export function ServerOn (event: string) {
	return function (target: Object, propertyKey: string) {
		addListenerMetadata({
			type: "server",
			action: "on",
			target: target,
			methodName: propertyKey,
			eventName: event,
			dataCheck: false
		})
	}
}