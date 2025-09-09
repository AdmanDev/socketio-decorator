import { updateControllerMetadata } from "../../globalMetadata"
import { SiodDecoratorError } from "../../Models/Errors/SiodDecoratorError"

/**
 * Decorator to specify the socket namespace for a controller.
 * @param {string} namespace The namespace to use for the socket controller
 * @returns {Function} The decorator function
 */
export function SocketNamespace (namespace: string) {
	return (target: Function) => {
		if (!namespace.startsWith("/")) {
			throw new SiodDecoratorError("Namespace must be a string starting with '/'")
		}

		updateControllerMetadata(target, { namespace })
	}
}
