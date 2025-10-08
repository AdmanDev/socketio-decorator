import { ListenerOperations } from "../../MetadataRepository/Operations/ListenerOperations"
import { ListenerDecoratorOptions } from "../../Models/DecoratorOptions/DecoratorOptions"

/**
 * Regiser a method as "socket.onAny" event listener
 * @param {ListenerDecoratorOptions | undefined} options The options for the listener
 * @returns {Function} The decorator function
 */
export function SocketOnAny (options?: ListenerDecoratorOptions) {
	return function (target: Object, propertyKey: string) {
		ListenerOperations.add({
			type: "socket",
			action: "onAny",
			target: target,
			methodName: propertyKey,
			eventName: "",
			dataCheck: options?.disableDataValidation === false
		})
	}
}