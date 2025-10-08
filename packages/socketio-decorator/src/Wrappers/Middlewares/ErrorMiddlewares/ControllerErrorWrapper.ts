import { ControllerMetadata } from "../../../MetadataRepository/MetadataObjects/Metadata"
import { BaseErrorMiddlewareWrapper } from "./BaseErrorMiddlewareWrapper"
import { Wrapper } from "../../WrapperCore/Wrapper"
import { IErrorMiddleware } from "../../../Interfaces/IErrorMiddleware"

/**
 * Defines a wrapper to wrap controllers methods with the error middleware.
 */
export class ControllerErrorWrapper extends Wrapper {
	/** @inheritdoc */
	public execute (metadata: ControllerMetadata) {
		const errorMiddleware = BaseErrorMiddlewareWrapper.getErrorMiddlewareInstance()
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
			BaseErrorMiddlewareWrapper.wrapMethod(errorMiddleware, methodName, metadata.controllerInstance!)
		})
	}
}