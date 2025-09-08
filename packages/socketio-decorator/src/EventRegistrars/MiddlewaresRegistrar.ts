import { IoCContainer } from "../IoCContainer"
import { addEventBinder, config } from "../globalMetadata"
import { IServerMiddleware } from "../Interfaces/IServerMiddleware"
import { ISocketMiddleware } from "../Interfaces/ISocketMiddleware"

/**
 * A class that is used to register middlewares event
 */
export class MiddlewaresRegistrar {

	/**
	 * Registers all middlewares
	 */
	public static registerAll () {
		MiddlewaresRegistrar.registerServerMiddlewares()
		MiddlewaresRegistrar.registerSocketMiddlewares()
	}

	/**
	 * Registers the server middlewares
	 */
	private static registerServerMiddlewares () {
		if (!config.serverMiddlewares || config.serverMiddlewares.length === 0) {
			return
		}

		const middlewares = IoCContainer.getInstances<IServerMiddleware>(config.serverMiddlewares)

		middlewares.forEach(middleware => {
			config.ioserver.use(middleware.use.bind(middleware))
		})
	}

	/**
	 * Registers the socket middlewares
	 */
	private static registerSocketMiddlewares () {
		if (!config.socketMiddlewares || config.socketMiddlewares.length === 0) {
			return
		}

		const middlewares = IoCContainer.getInstances<ISocketMiddleware>(config.socketMiddlewares)
		middlewares.forEach(middleware => {
			addEventBinder("/", "connection", (socket) => {
				socket.use((events, next) => {
					middleware.use(socket, events, next)
				})
			})
		})
	}
}