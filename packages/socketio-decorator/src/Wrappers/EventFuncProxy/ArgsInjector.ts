import { Socket } from "socket.io"
import { config } from "../../globalMetadata"
import { SiodDecoratorError } from "../../Models/Errors/SiodDecoratorError"
import { EventFuncProxyArgs, EventFuncProxyType } from "../../Models/EventFuncProxyType"
import { ControllerMetadata } from "../../Models/Metadata/Metadata"
import { MethodArgMetadata, MethodArgValueType } from "../../Models/Metadata/MethodArgMetadata"
import { Wrapper } from "../WrapperCore/Wrapper"
import { SocketDataStore } from "./ArgProviders/SocketDataStore"

/**
 * Defines the event function handler proxy wrapper to manage handler args
 */
export class ArgsInjector extends Wrapper {
	/** @inheritdoc */
	public execute (metadata: ControllerMetadata): void {
		metadata.methodMetadata.forEach(methodMetadata => {
			this.wrapMethod(metadata.controllerInstance, methodMetadata.methodName)
		})
	}

	/**
	 * Wraps the method to inject normalized arguments
	 * @param {any} controller The controller instance.
	 * @param {string} methodName The name of the method to wrap.
	 */
	private wrapMethod (controller: Any, methodName: string) {
		const originalHandler = controller[methodName] as (...args: unknown[]) => Promise<unknown>

		const proxy: EventFuncProxyType = async (proxyArgs) => {
			const finalArgs = await this.buildFinalHandlerArgs(proxyArgs)
			return await originalHandler.apply(controller, finalArgs)
		}

		controller[methodName] = proxy
	}

	/**
	 * Builds the final arguments for the handler
	 * @param {EventFuncProxyArgs} args The proxy args
	 * @returns {Promise<unknown[]>} The final arguments
	 */
	private async buildFinalHandlerArgs (args: EventFuncProxyArgs) {
		const argsMetadata = args.methodMetadata.argsMetadata

		if (args.methodMetadata.metadata.ioMetadata.listenerMetadata.length === 0) {
			return args.data
		}

		const finalArgs: unknown[] = []

		for (const meta of argsMetadata) {
			finalArgs[meta.parameterIndex] = await this.getArgValue(args, meta)
		}

		return finalArgs
	}

	/**
	 * Gets the value of the argument based on the metadata
	 * @param {EventFuncProxyArgs} args The proxy args
	 * @param {MethodArgMetadata} argMetadata The argument metadata
	 * @returns {Promise<unknown>} The value of the argument
	 */
	private async getArgValue (args: EventFuncProxyArgs, argMetadata: MethodArgMetadata) {

		const argsReference: Record<MethodArgValueType, unknown> = {
			socket: args.socket,
			socketDataAttribute: this.getSocketDataAttribute(argMetadata, args.socket),
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
	private async getCurrentUserArg (argMetadata: MethodArgMetadata, socket: Socket | null) {
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

	/**
	 * Gets the socket data attribute value from the socket
	 * @param {MethodArgMetadata} argMetadata The argument metadata
	 * @param {Socket | null} socket The socket instance
	 * @returns {SocketDataStore | unknown | null} The socket data attribute value
	 */
	private getSocketDataAttribute (argMetadata: MethodArgMetadata, socket: Socket | null) {
		if (argMetadata.valueType !== "socketDataAttribute") {
			return null
		}

		if (!socket) {
			throw new SiodDecoratorError("Unable to get socket data attribute, the socket instance is undefined.")
		}

		if (!argMetadata.dataKey) {
			return new SocketDataStore(socket)
		}

		return socket.data[argMetadata.dataKey] || null
	}
}