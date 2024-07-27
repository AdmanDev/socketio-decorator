import { getInstances } from "../container"
import { addBinderEvent } from "../globalMetadata"
import { IServerMiddleware } from "../interfaces/IServerMiddleware"
import { ISocketMiddleware } from "../interfaces/ISocketMiddleware"
import { SiodConfig } from "../types/SiodConfig"

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
		addBinderEvent("connection", (socket) => {
			socket.use(middleware.use)
		})
	})
}