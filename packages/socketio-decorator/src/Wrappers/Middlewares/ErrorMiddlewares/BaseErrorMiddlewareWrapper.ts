import { Socket } from "socket.io"
import { config } from "../../../globalMetadata"
import { IErrorMiddleware } from "../../../Interfaces/IErrorMiddleware"
import { IoCContainer } from "../../../IoCContainer"
import { EventFuncProxyArgs } from "../../../Models/EventFuncProxyType"

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

		const otherMiddlewares = IoCContainer.getInstances([...config.serverMiddlewares || [], ...config.socketMiddlewares || []])

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

		return IoCContainer.getInstances([config.errorMiddleware])?.[0] as IErrorMiddleware | undefined
	}

	/**
	 * Wraps method to handle errors with error middleware
	 * @param {IErrorMiddleware} errorMiddleware The error middleware
	 * @param {string} methodName The method name
	 * @param {any} controllerInstance The controller instance
	 */
	public static wrapMethod (errorMiddleware: IErrorMiddleware, methodName: string, controllerInstance: Any) {
		const originalMethod = controllerInstance[methodName]

		const wrappedMethod = async function (...args: unknown[]) {
			try {
				return await originalMethod.apply(controllerInstance, args)
			} catch (error: Any) {
				const socket = BaseErrorMiddlewareWrapper.getSocketFromArgs(...args)
				return errorMiddleware.handleError(error, socket)
			}
		}

		controllerInstance[methodName] = wrappedMethod
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