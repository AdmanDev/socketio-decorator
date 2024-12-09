import { Socket } from "socket.io"
import { MethodMetadata } from "../Models/Metadata/MethodMetadata"
import { IErrorMiddleware } from "../Interfaces/IErrorMiddleware"
import { config, getAllMetadata } from "../globalMetadata"
import { MetadataUtils } from "../Utils/MetadataUtils"
import { IoCContainer } from "../IoCContainer"

/**
 * Error middleware wrapper
 */
export class ErrorMiddlewareWrapper {

	/**
	 * Wraps all controllers and middlewares to add error middleware
	 */
	public static wrapAllControllersAndMiddlewares () {
		if (!config.errorMiddleware) {
			return
		}

		const errorMiddleware = IoCContainer.getInstances([config.errorMiddleware], config.iocContainer)?.[0] as IErrorMiddleware | undefined
		if (!errorMiddleware) {
			return
		}

		ErrorMiddlewareWrapper.wrapAllControllers(errorMiddleware)
		ErrorMiddlewareWrapper.wrapAllMiddlewares(errorMiddleware)
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
		controllerInstance[methodName] = async function (...args: unknown[]) {
			try {
				return await originalMethod.apply(controllerInstance, args)
			} catch (error: Any) {
				const socket = args.find(arg => arg instanceof Socket) as Socket | undefined
				return errorMiddleware.handleError(error, socket)
			}
		}
	}

	/**
	 * Wraps all controllers to add error middleware
	 * @param {IErrorMiddleware} errorMiddleware The error middleware
	 */
	private static wrapAllControllers (errorMiddleware: IErrorMiddleware) {
		const metadata = getAllMetadata()
		const controllerMetadatas = MetadataUtils.getControllerMetadata(config, metadata)

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
	 * @param {IErrorMiddleware} errorMiddleware The error middleware
	 */
	private static wrapAllMiddlewares (errorMiddleware: IErrorMiddleware) {
		const otherMiddlewares = IoCContainer.getInstances([...config.serverMiddlewares || [], ...config.socketMiddlewares || []], config.iocContainer)

		otherMiddlewares.forEach(middleware => {
			const methodMetadata: MethodMetadata = {
				methodName: "use",
				controllerInstance: middleware
			}

			ErrorMiddlewareWrapper.wrapMethod(methodMetadata, errorMiddleware)
		})
	}
}