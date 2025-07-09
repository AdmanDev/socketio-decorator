import { Socket } from "socket.io"
import { config } from "../../globalMetadata"
import { EventFuncProxyArgs } from "../../Models/EventFuncProxyType"
import { MethodArgMetadata, MethodArgValueType } from "../../Models/Metadata/MethodArgMetadata"
import { SiodDecoratorError } from "../../Models/Errors/SiodDecoratorError"

/**
 * Defines the event function argument provider.
 */
export class EventFuncArgProvider {
	/**
	 * Builds the final arguments for the handler
	 * @param {EventFuncProxyArgs} args The proxy args
	 * @returns {Promise<unknown[]>} The final arguments
	 */
	public static async buildFinalHandlerArgs (args: EventFuncProxyArgs) {
		const argsMetadata = args.methodMetadata.argsMetadata

		if (args.methodMetadata.metadata.ioMetadata.listenerMetadata.length === 0) {
			return args.data
		}

		const finalArgs: unknown[] = []

		for (const meta of argsMetadata) {
			finalArgs[meta.parameterIndex] = await EventFuncArgProvider.getArgValue(args, meta)
		}

		return finalArgs
	}

	/**
	 * Gets the value of the argument based on the metadata
	 * @param {EventFuncProxyArgs} args The proxy args
	 * @param {MethodArgMetadata} argMetadata The argument metadata
	 * @returns {Promise<unknown>} The value of the argument
	 */
	private static async getArgValue (args: EventFuncProxyArgs, argMetadata: MethodArgMetadata) {

		const argsReference: Record<MethodArgValueType, unknown> = {
			socket: args.socket,
			data: args.data,
			eventName: args.eventName,
			currentUser: await this.getCurrentUserArg(argMetadata, args.socket)
		}

		switch (argMetadata.valueType) {
			case "data":
				return args.data[argMetadata.dataIndex]

			default:
				return argsReference[argMetadata.valueType]
		}
	}

	/**
	 * Gets the current user argument from the socket
	 * @param {MethodArgMetadata} argMetadata The argument metadata
	 * @param {Socket | null} socket The socket instance
	 * @returns {Promise<unknown | null>} The current user value
	 */
	private static async getCurrentUserArg (argMetadata: MethodArgMetadata, socket: Socket | null) {
		if (argMetadata.valueType !== "currentUser") {
			return Promise.resolve(null)
		}

		if (!config.currentUserProvider) {
			throw new SiodDecoratorError("To use @CurrentUser decorator, you must provide a currentUserProvider in the config.")
		}

		if (!socket) {
			throw new SiodDecoratorError("Unable to get current user, the socket instance is undefined.")
		}

		let currentUser: unknown = null

		if (config.currentUserProvider) {
			currentUser = await config.currentUserProvider(socket)
		}

		return currentUser
	}
}