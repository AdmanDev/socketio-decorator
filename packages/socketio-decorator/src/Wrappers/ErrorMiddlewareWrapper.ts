import { Socket } from "socket.io"
import { config } from "../globalMetadata"
import { IErrorMiddleware } from "../Interfaces/IErrorMiddleware"
import { IoCContainer } from "../IoCContainer"
import { EventFuncProxyArgs } from "../Models/EventFuncProxyType"
import { ControllerMetadata } from "../Models/Metadata/Metadata"

/**
 * Error middleware wrapper
 */
export class ErrorMiddlewareWrapper {

	/**
	 * Wraps all controllers with the error middleware
	 * @param {ControllerMetadata} metadata The metadata of the controller
	 */
	public static wrapController (metadata: ControllerMetadata) {
		const errorMiddleware = ErrorMiddlewareWrapper.getErrorMiddlewareInstance()
		if (!errorMiddleware) {
			return
		}

		ErrorMiddlewareWrapper.addMiddlewareToController(metadata, errorMiddleware)
	}

	/**
	 * Gets the error middleware instance
	 * @returns {IErrorMiddleware | undefined} The error middleware instance or undefined if not set
	 */
	private static getErrorMiddlewareInstance () {
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

		// eslint-disable-next-line jsdoc/require-jsdoc
		const wrappedMethod = async function (...args: unknown[]) {
			try {
				return await originalMethod.apply(controllerInstance, args)
			} catch (error: Any) {
				const socket = ErrorMiddlewareWrapper.getSocketFromArgs(...args)
				return errorMiddleware.handleError(error, socket)
			}
		}

		controllerInstance[methodName] = wrappedMethod
	}

	/**
	 * Wraps all controllers to add error middleware
	 * @param {ControllerMetadata} metadata The metadata of the controller
	 * @param {IErrorMiddleware} errorMiddleware The error middleware
	 */
	private static addMiddlewareToController (metadata: ControllerMetadata, errorMiddleware: IErrorMiddleware) {
		const ioMetadata = metadata.methodMetadata.flatMap(m => [m.metadata.ioMetadata.listenerMetadata, m.metadata.ioMetadata.emitterMetadata].flat())

		const unicMethods = ioMetadata
			.map(m => m.methodName)
			.filter((value, index, self) => self.indexOf(value) === index)

		unicMethods.forEach(methodName => {
			ErrorMiddlewareWrapper.wrapMethod(errorMiddleware, methodName, metadata.controllerInstance)
		})
	}

	/**
	 * Wraps all middlewares to add error middleware
	 */
	public static wrapAllMiddlewares () {
		const errorMiddleware = ErrorMiddlewareWrapper.getErrorMiddlewareInstance()
		if (!errorMiddleware) {
			return
		}

		const otherMiddlewares = IoCContainer.getInstances([...config.serverMiddlewares || [], ...config.socketMiddlewares || []])

		otherMiddlewares.forEach(middleware => {
			ErrorMiddlewareWrapper.wrapMethod(errorMiddleware, "use", middleware)
		})
	}

	/**
	 * Gets the socket from the arguments
	 * @param {any[]} args The arguments
	 * @returns {Socket | undefined} The socket
	 */
	private static getSocketFromArgs (...args: unknown[]) {
		let socket: Socket| undefined
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