import { IoCContainer } from "../../../IoCContainer"
import { ConfigStore } from "../../../MetadataRepository/Stores/ConfigStore"
import { MiddlewareInstance } from "../../../Models/Utilities/ControllerTypes"
import { Operation } from "../../WrapperCore/Operation/Operation"
import { ErrorMiddlewareWrapperCore } from "./ErrorMiddlewareWrapperCore"

/**
 * Defines an error wrapper for the socket.io middlewares
 */
export class IoMiddlewareErrorWrapper extends Operation {
	/** @inheritdoc */
	public execute () {
		const errorMiddleware = ErrorMiddlewareWrapperCore.getErrorMiddlewareInstance()
		if (!errorMiddleware) {
			return
		}

		const config = ConfigStore.get()

		const otherMiddlewares = IoCContainer.getInstances<MiddlewareInstance>([
			...config.serverMiddlewares || [],
			...config.socketMiddlewares || []
		])

		otherMiddlewares.forEach(middleware => {
			ErrorMiddlewareWrapperCore.wrapMethod(errorMiddleware, "use", middleware)
		})
	}
}