import { addEmitterMetadata } from "../../globalMetadata"

/**
 * Decorator that register a method as an emiter to current client (socket.emit)
 * @param {string} eventName The event name to emit
 * @returns {MethodDecorator} The decorator function
 */
export function SocketEmitter (eventName: string): MethodDecorator {
	return function (target: Object, propertyKey: string | symbol) {
		addEmitterMetadata({
			type: "socket",
			action: "emitSelf",
			target: target.constructor,
			methodName: propertyKey as string,
			message: eventName,
			to: ""
		})
	}
}