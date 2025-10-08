import { ListenerOperations } from "../../MetadataRepository/Operations/ListenerOperations"

/**
 * Register a new catch-all listener for outgoing packets (socket.onAnyOutgoing)
 * @returns {Function} The decorator function
 */
export function SocketOnAnyOutgoing () {
	return function (target: Object, propertyKey: string) {
		ListenerOperations.add({
			type: "socket",
			action: "onAnyOutgoing",
			target: target,
			methodName: propertyKey,
			eventName: "",
			dataCheck: false
		})
	}
}