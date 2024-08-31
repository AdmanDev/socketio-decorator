import { addEmitterMetadata } from "../../globalMetadata"

/**
 * Decorator that register a method as an emiter to all clients connected to the server (io.emit)
 * Must be used with a listener decorator (ServerOn, SocketOn, ...)
 * @param {string} eventName The event name to emit
 * @param {string} to The destination to emit the event
 * @returns {MethodDecorator} The decorator function
 */
export function ServerEmitter (eventName?: string, to?: string,) {
	return function (target: Object, propertyKey: string | symbol) {
		addEmitterMetadata({
			type: "server",
			action: "emitto",
			target: target,
			methodName: propertyKey as string,
			message: eventName ?? "",
			to: to ?? "",
			dataCheck: false
		})
	}
}