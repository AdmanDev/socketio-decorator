import { addListenerMetadata } from "../../globalMetadata"

/**
 * Regiser a method as "socket.onAny" event listener
 * @returns {Function} The decorator function
 */
export function SocketOnAny () {
	return function (target: Object, propertyKey: string) {
		addListenerMetadata({
			type: "socket",
			action: "onAny",
			target: target.constructor,
			methodName: propertyKey,
			eventName: ""
		})
	}
}