import { addListenerMetadata } from "../../globalMetadata"
import { ListenerDecoratorOptions } from "../../types/decoratorOptions/decoratorOptions"

/**
 * Regiser a method as "socket.on" event listener for the given event
 * @param {string} event The event to listen for
 * @param {ListenerDecoratorOptions | undefined} options The options for the listener
 * @returns {Function} The decorator function
 */
export function SocketOn (event: string, options?: ListenerDecoratorOptions) {
	return function (target: Object, propertyKey: string) {
		addListenerMetadata({
			type: "socket",
			action: "on",
			target: target,
			methodName: propertyKey,
			eventName: event,
			dataCheck: !options?.disableDataValidation
		})
	}
}