import { EmitterOperations } from "../../MetadataRepository/Operations/EmitterOperations"

/**
 * Decorator that register a method as an emiter to current client (socket.emit)
 * Must be used with a listener decorator (ServerOn, SocketOn, ...)
 * @param {string | undefined} eventName The event name to emit
 * @returns {MethodDecorator} The decorator function
 */
export function SocketEmitter (eventName?: string): MethodDecorator {
	return function (target: Object, propertyKey: string | symbol) {
		EmitterOperations.add({
			type: "socket",
			action: "emitSelf",
			target: target,
			methodName: propertyKey as string,
			message: eventName ?? "",
			to: "",
		})
	}
}