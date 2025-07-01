import { SiodInvalidMetadataError } from "../Models/Errors/SiodInvalidMetadataError"
import { EventFuncProxyArgs, EventFuncProxyType } from "../Models/EventFuncProxyType"
import { MethodArgMetadata, MethodArgValueType } from "../Models/Metadata/MethodArgMetadata"
import { getReflectMethodMetadata } from "../reflectLetadataFunc"

/**
 * Define the evant function handler proxy wrapper to manage handler args
 */
export class EventFuncProxyWrapper {
	/**
	 * Adds last proxy layer to the method
	 * @param {any} controller The controller instance.
	 * @param {string} methodName The name of the method to wrap.
	 */
	public static addLastProxyLayer (controller: Any, methodName: string) {
		const originalHandler = controller[methodName] as (...args: unknown[]) => Promise<unknown>

		const proxy: EventFuncProxyType = async (proxyArgs) => {
			const finalArgs = EventFuncProxyWrapper.buildFinalHandlerArgs(proxyArgs)
			return await originalHandler.apply(controller, finalArgs)
		}

		controller[methodName] = proxy
	}

	/**
	 * Adds the first proxy layer to the method
	 * @param {any} controller The controller instance
	 * @param {string} methodName The name of the method
	 */
	public static addFirstProxyLayer (controller: Any, methodName: string) {
		const originalHandler = controller[methodName] as Function

		const proxy = async function (...args: unknown[]) {
			let proxyArgs: EventFuncProxyArgs

			const firstArg = args.length > 0 ? args[0] : null

			if (firstArg && firstArg instanceof EventFuncProxyArgs) {
				proxyArgs = firstArg
			} else {
				proxyArgs = EventFuncProxyWrapper.createProxyArgs(controller, methodName, args)
			}

			return await originalHandler.apply(controller, [proxyArgs])

		}

		controller[methodName] = proxy
	}

	/**
	 * Creates a proxy args
	 * @param {any} controller The controller instance
	 * @param {string} methodName The name of the method
	 * @param {unknown[]} args The arguments
	 * @returns {EventFuncProxyArgs} The proxy args
	 */
	private static createProxyArgs (controller: Any, methodName: string, args: unknown[]) {
		const methodMetadata = getReflectMethodMetadata(controller.constructor.prototype, methodName)

		if (!methodMetadata) {
			throw new SiodInvalidMetadataError(`Method ${methodName} not found in ${controller.constructor.name}`)
		}

		return new EventFuncProxyArgs(args, methodMetadata, "", null)
	}

	/**
	 * Builds the final arguments for the handler
	 * @param {EventFuncProxyArgs} args The proxy args
	 * @returns {unknown[]} The final arguments
	 */
	private static buildFinalHandlerArgs (args: EventFuncProxyArgs) {
		const argsMetadata = args.methodMetadata.argsMetadata

		if (args.methodMetadata.metadata.ioMetadata.listenerMetadata.length === 0) {
			return args.data
		}

		const finalArgs: unknown[] = []

		for (const meta of argsMetadata) {
			finalArgs[meta.parameterIndex] = EventFuncProxyWrapper.getArgValue(args, meta)
		}

		return finalArgs
	}

	/**
	 * Gets the value of the argument based on the metadata
	 * @param {EventFuncProxyArgs} args The proxy args
	 * @param {MethodArgMetadata} argMetadata The argument metadata
	 * @returns {unknown} The value of the argument
	 */
	private static getArgValue (args: EventFuncProxyArgs, argMetadata: MethodArgMetadata) {
		const argsReference: Record<MethodArgValueType, unknown> = {
			socket: args.socket,
			data: args.data,
			eventName: args.eventName,
		}

		switch (argMetadata.valueType) {
			case "data":
				return args.data[argMetadata.dataIndex]

			default:
				return argsReference[argMetadata.valueType]
		}
	}
}