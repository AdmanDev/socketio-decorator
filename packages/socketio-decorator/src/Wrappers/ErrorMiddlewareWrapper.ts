import { Socket } from "socket.io"
import { config } from "../globalMetadata"
import { IErrorMiddleware } from "../Interfaces/IErrorMiddleware"
import { IoCContainer } from "../IoCContainer"
import { EventFuncProxyArgs } from "../Models/EventFuncProxyType"
import { TreeRootMetadata } from "../Models/Metadata/Metadata"
import { MethodMetadata } from "../Models/Metadata/MethodMetadata"
import { MetadataUtils } from "../Utils/MetadataUtils"

/**
 * Error middleware wrapper
 */
export class ErrorMiddlewareWrapper {

	/**
	 * Wraps all controllers with the error middleware
	 * @param {TreeRootMetadata} metadata The metadata of the controller
	 */
	public static wrapController (metadata: TreeRootMetadata) {
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
	 * @param {MethodMetadata} methodMetadata The method metadata
	 * @param {IErrorMiddleware} errorMiddleware The error middleware
	 */
	public static wrapMethod (methodMetadata: MethodMetadata, errorMiddleware: IErrorMiddleware) {
		const { methodName, controllerInstance } = methodMetadata
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
	 * @param {TreeRootMetadata} metadata The metadata of the controller
	 * @param {IErrorMiddleware} errorMiddleware The error middleware
	 */
	private static addMiddlewareToController (metadata: TreeRootMetadata, errorMiddleware: IErrorMiddleware) {
		const controllerMetadatas = MetadataUtils.getControllerMetadata([metadata])

		controllerMetadatas.forEach(cm => {
			const unicMethods = cm.metadatas.map(m => m.methodName).filter((value, index, self) => self.indexOf(value) === index)
			unicMethods.forEach(methodName => {
				const methodMetadata: MethodMetadata = {
					methodName,
					controllerInstance: cm.controllerInstance
				}

				ErrorMiddlewareWrapper.wrapMethod(methodMetadata, errorMiddleware)
			})
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
			const methodMetadata: MethodMetadata = {
				methodName: "use",
				controllerInstance: middleware
			}

			ErrorMiddlewareWrapper.wrapMethod(methodMetadata, errorMiddleware)
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