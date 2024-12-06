import { Socket } from "socket.io"
import { getInstances } from "../container"
import { addEventBinder, getAllMetadata } from "../globalMetadata"
import { IErrorMiddleware } from "../interfaces/IErrorMiddleware"
import { IServerMiddleware } from "../interfaces/IServerMiddleware"
import { ISocketMiddleware } from "../interfaces/ISocketMiddleware"
import { SiodConfig } from "../types/SiodConfig"
import { getControllerMetadata } from "./metadata/metadataUtils"
import { MethodMetadata } from "../types/metadata/methodMetadata"

/**
 * Binds error middleware
 * @param {SiodConfig} config The socketio decocator configuration
 */
export function bindErrorMiddleware (config: SiodConfig) {
	if (!config.errorMiddleware) {
		return
	}

	const errorMiddleware = getInstances([config.errorMiddleware], config.iocContainer)?.[0] as IErrorMiddleware | undefined
	if (!errorMiddleware) {
		return
	}

	const methodsToWrap: MethodMetadata[] = []

	const metadata = getAllMetadata()
	const controllerMetadatas = getControllerMetadata(config, metadata)

	const otherMiddlewares = getInstances([...config.serverMiddlewares || [], ...config.socketMiddlewares || []], config.iocContainer)
	otherMiddlewares.forEach(middleware => {
		methodsToWrap.push({
			methodName: "use",
			controllerInstance: middleware
		})
	})

	controllerMetadatas.forEach(cm => {
		const unicMethods = cm.metadatas.map(m => m.methodName).filter((value, index, self) => self.indexOf(value) === index)
		unicMethods.forEach(methodName => {
			methodsToWrap.push({
				methodName,
				controllerInstance: cm.controllerInstance
			})
		})
	})

	methodsToWrap.forEach(({ methodName, controllerInstance }) => {
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
	})
}

/**
 * Binds server middlewares
 * @param {SiodConfig} config The socketio decocator configuration
 */
export function bindServerMiddlewares (config: SiodConfig) {
	if (!config.serverMiddlewares || config.serverMiddlewares.length === 0) {
		return
	}

	const middlewares = getInstances<IServerMiddleware>(config.serverMiddlewares, config.iocContainer)
	middlewares.forEach(middleware => {
		config.ioserver.use(middleware.use.bind(middleware))
	})
}

/**
 * Binds socket middlewares 
 * @param {SiodConfig} config The socketio decocator configuration
 */
export function bindSocketMiddlewares (config: SiodConfig) {
	if (!config.socketMiddlewares || config.socketMiddlewares.length === 0) {
		return
	}

	const middlewares = getInstances<ISocketMiddleware>(config.socketMiddlewares, config.iocContainer)
	middlewares.forEach(middleware => {
		addEventBinder("connection", (socket) => {
			socket.use(middleware.use)
		})
	})
}