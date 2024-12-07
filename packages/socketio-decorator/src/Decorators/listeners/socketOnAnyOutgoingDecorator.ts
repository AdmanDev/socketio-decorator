import { addListenerMetadata } from "../../globalMetadata"

/**
 * Register a new catch-all listener for outgoing packets (socket.onAnyOutgoing)
 * @returns {Function} The decorator function
 */
export function SocketOnAnyOutgoing () {
	return function (target: Object, propertyKey: string) {
		addListenerMetadata({
			type: "socket",
			action: "onAnyOutgoing",
			target: target,
			methodName: propertyKey,
			eventName: "",
			dataCheck: false
		})
	}
}