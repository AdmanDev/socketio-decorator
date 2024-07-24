import { getInstances } from "../container"
import { IServerMiddleware } from "../interfaces/IServerMiddleware"
import { ISocketMiddleware } from "../interfaces/ISocketMiddleware"
import { SiodConfig } from "../types/SiodConfig"

/**
 * Use server middlewares
 * @param {SiodConfig} config The socketio decocator configuration
 */
export function useServerMiddlewares (config: SiodConfig) {
	if (!config.serverMiddlewares || config.serverMiddlewares.length === 0) {
		return
	}

	const middlewares = getInstances<IServerMiddleware>(config.serverMiddlewares, config.iocContainer)
	middlewares.forEach(middleware => {
		config.ioserver.use(middleware.use.bind(middleware))
	})
}

/**
 * Use socket middlewares 
 * @param {SiodConfig} config The socketio decocator configuration
 */
export function useSocketMiddlewares (config: SiodConfig) {
	if (!config.socketMiddlewares || config.socketMiddlewares.length === 0) {
		return
	}

	const middlewares = getInstances<ISocketMiddleware>(config.socketMiddlewares, config.iocContainer)
	middlewares.forEach(middleware => {
		config.ioserver.on("connection", (socket) => {
			socket.use(middleware.use)
		})
	})
}