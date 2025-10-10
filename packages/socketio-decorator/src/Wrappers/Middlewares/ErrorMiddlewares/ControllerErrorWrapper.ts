import { ControllerMetadata } from "../../../MetadataRepository/MetadataObjects/Metadata"
import { ControllerWrapper } from "../../WrapperCore/ControllerWrapper/ControllerWrapper"
import { IErrorMiddleware } from "../../../Interfaces/IErrorMiddleware"
import { ErrorMiddlewareWrapperCore } from "./ErrorMiddlewareWrapperCore"

/**
 * Defines a wrapper to wrap controllers methods with the error middleware.
 */
export class ControllerErrorWrapper extends ControllerWrapper {
	/** @inheritdoc */
	public execute (metadata: ControllerMetadata) {
		const errorMiddleware = ErrorMiddlewareWrapperCore.getErrorMiddlewareInstance()
		if (!errorMiddleware) {
			return
		}

		this.addMiddlewareToController(metadata, errorMiddleware)
	}

	/**
	 * Wraps all controllers to add error middleware
	 * @param {ControllerMetadata} metadata The metadata of the controller
	 * @param {IErrorMiddleware} errorMiddleware The error middleware
	 */
	private addMiddlewareToController (metadata: ControllerMetadata, errorMiddleware: IErrorMiddleware) {
		const ioMetadata = metadata.methodMetadata.flatMap(
			m => [m.metadata.ioMetadata.listenerMetadata, m.metadata.ioMetadata.emitterMetadata].flat()
		)

		const unicMethods = ioMetadata
			.map(m => m.methodName)
			.filter((value, index, self) => self.indexOf(value) === index)

		unicMethods.forEach(methodName => {
			ErrorMiddlewareWrapperCore.wrapMethod(errorMiddleware, methodName, metadata.controllerInstance!)
		})
	}
}