import { getInstances } from "../container"
import { IServerMiddleware } from "../interfaces/IServerMiddleware"
import { SiodConfig } from "../types/SiodConfig"

/**
 * Use metadata from decorators
 * @param {SiodConfig} config The socketio decocator configuration
 */
export function useServerMiddleware (config: SiodConfig) {
	if (!config.serverMiddlewares || config.serverMiddlewares.length === 0) {
		return
	}

	const middlewares = getInstances<IServerMiddleware>(config.serverMiddlewares, config.iocContainer)
	middlewares.forEach(middleware => {
		config.ioserver.use(middleware.use.bind(middleware))
	})
}