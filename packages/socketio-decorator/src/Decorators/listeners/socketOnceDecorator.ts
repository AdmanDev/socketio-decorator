import { addListenerMetadata } from "../../globalMetadata"
import { ListenerDecoratorOptions } from "../../Models/DecoratorOptions/DecoratorOptions"

/**
 * Regiser a method as "socket.once" event listener for the given event
 * @param {string} event The event to listen for
 * @param {ListenerDecoratorOptions | undefined} options The options for the listener
 * @returns {Function} The decorator function
 */
export function SocketOnce (event: string, options?: ListenerDecoratorOptions) {
	return function (target: Object, propertyKey: string) {
		addListenerMetadata({
			type: "socket",
			action: "once",
			target: target,
			methodName: propertyKey,
			eventName: event,
			dataCheck: !options?.disableDataValidation
		})
	}
}