import { EmitterOperations } from "../../MetadataRepository/Operations/EmitterOperations"
import type { EmitterOption } from "../../Models/DecoratorOptions/EmitterOption"

/**
 * Decorator that register a method as an emitter to all clients connected to the server (io.emit or io.to(...).emit)
 * @param {string | undefined} eventName The event name to emit (if undefined, must be set in {@link EmitterOption})
 * @param {string | undefined} to The destination to emit the event (if undefined, will emit to all clients)
 * @returns {MethodDecorator} The decorator function
 */
export function ServerEmitter (eventName?: string, to?: string,) {
	return function (target: Object, propertyKey: string | symbol) {
		EmitterOperations.add({
			type: "server",
			action: "emitto",
			target: target,
			methodName: propertyKey as string,
			message: eventName ?? "",
			to: to ?? "",
		})
	}
}