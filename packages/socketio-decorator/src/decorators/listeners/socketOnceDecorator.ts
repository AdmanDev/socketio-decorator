import { addListenerMetadata } from "../../globalMetadata"

/**
 * Regiser a method as "socket.once" event listener for the given event
 * @param {string} event The event to listen for
 * @returns {Function} The decorator function
 */
export function SocketOnce (event: string) {
	return function (target: Object, propertyKey: string) {
		addListenerMetadata({
			type: "socket",
			action: "once",
			target: target.constructor,
			methodName: propertyKey,
			eventName: event
		})
	}
}