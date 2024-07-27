import { addEmitterMetadata } from "../../globalMetadata"

/**
 * Decorator that register a method as an emiter to all clients connected to the server (io.emit)
 * @param {string} to The destination to emit the event
 * @param {string} eventName The event name to emit
 * @returns {MethodDecorator} The decorator function
 */
export function ServerEmitter (to: string, eventName: string): MethodDecorator {
	return function (target: Object, propertyKey: string | symbol) {
		addEmitterMetadata({
			type: "server",
			action: "emitto",
			target: target.constructor,
			methodName: propertyKey as string,
			message: eventName,
			to
		})
	}
}