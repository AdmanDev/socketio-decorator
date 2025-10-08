import { IoCContainer } from "../IoCContainer"
import { EventBinderStore } from "../MetadataRepository/Stores/EventBinderStore"
import { ConfigStore } from "../MetadataRepository/Stores/ConfigStore"
import { IServerMiddleware } from "../Interfaces/IServerMiddleware"
import { ISocketMiddleware } from "../Interfaces/ISocketMiddleware"
import { getReflectMiddlewareOptionMetadata } from "../reflectMetadataFunc"
import { Namespace, Server } from "socket.io"

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
		const config = ConfigStore.get()

		const serverMiddlewares = config.serverMiddlewares
		if (!serverMiddlewares || serverMiddlewares.length === 0) {
			return
		}

		const middlewares = IoCContainer.getInstances<IServerMiddleware>(serverMiddlewares)

		middlewares.forEach(middleware => {
			const options = getReflectMiddlewareOptionMetadata(middleware.constructor)
			let ioNamespace: Server | Namespace = config.ioserver

			if (options?.namespace) {
				ioNamespace = config.ioserver.of(options.namespace)
			}

			ioNamespace.use(middleware.use.bind(middleware))
		})
	}

	/**
	 * Registers the socket middlewares
	 */
	private static registerSocketMiddlewares () {
		const socketMiddlewares = ConfigStore.get().socketMiddlewares
		if (!socketMiddlewares || socketMiddlewares.length === 0) {
			return
		}

		const middlewares = IoCContainer.getInstances<ISocketMiddleware>(socketMiddlewares)
		middlewares.forEach(middleware => {
			const options = getReflectMiddlewareOptionMetadata(middleware.constructor)
			const namespace = options?.namespace || "/"

			EventBinderStore.add(namespace, "connection", (socket) => {
				socket.use((events, next) => {
					middleware.use(socket, events, next)
				})
			})
		})
	}
}