import { Socket } from "socket.io"
import { config } from "../../../globalMetadata"
import { IErrorMiddleware } from "../../../Interfaces/IErrorMiddleware"
import { IoCContainer } from "../../../IoCContainer"
import { EventFuncProxyArgs } from "../../../Models/EventFuncProxyType"
import { MiddlewareInstance } from "../../../Models/Utilities/ControllerTypes"

/**
 * Error middleware wrapper
 */
export class BaseErrorMiddlewareWrapper {
	/**
	 * Wraps all middlewares to add error middleware
	 */
	public static wrapAllMiddlewares () {
		const errorMiddleware = BaseErrorMiddlewareWrapper.getErrorMiddlewareInstance()
		if (!errorMiddleware) {
			return
		}

		const otherMiddlewares = IoCContainer.getInstances<MiddlewareInstance>([
			...config.serverMiddlewares || [],
			...config.socketMiddlewares || []
		])

		otherMiddlewares.forEach(middleware => {
			BaseErrorMiddlewareWrapper.wrapMethod(errorMiddleware, "use", middleware)
		})
	}

	/**
	 * Gets the error middleware instance
	 * @returns {IErrorMiddleware | undefined} The error middleware instance or undefined if not set
	 */
	public static getErrorMiddlewareInstance () {
		if (!config.errorMiddleware) {
			return undefined
		}

		return IoCContainer.getInstance<IErrorMiddleware>(config.errorMiddleware)
	}

	/**
	 * Wraps method to handle errors with error middleware
	 * @param {IErrorMiddleware} errorMiddleware The error middleware
	 * @param {string} methodName The method name
	 * @param {MiddlewareInstance} middlewareInstance The middleware instance
	 */
	public static wrapMethod (errorMiddleware: IErrorMiddleware, methodName: string, middlewareInstance: MiddlewareInstance) {
		const originalMethod = middlewareInstance[methodName] as Function

		const wrappedMethod = async function (...args: unknown[]) {
			try {
				return await originalMethod.apply(middlewareInstance, args)
			} catch (error: unknown) {
				const socket = BaseErrorMiddlewareWrapper.getSocketFromArgs(...args)
				return errorMiddleware.handleError(error, socket)
			}
		}

		middlewareInstance[methodName] = wrappedMethod
	}

	/**
	 * Gets the socket from the arguments
	 * @param {any[]} args The arguments
	 * @returns {Socket | undefined} The socket
	 */
	private static getSocketFromArgs (...args: unknown[]) {
		let socket: Socket | undefined

		if (args.length > 0) {
			const firstArg = args[0]

			if (firstArg instanceof EventFuncProxyArgs) {
				socket = firstArg.socket || undefined
			} else {
				socket = args.find(arg => arg instanceof Socket) as Socket | undefined
			}
		}

		return socket
	}
}