import { ListenersRegistrar } from "./EventRegistrars/ListenersRegistrar"
import { MiddlewaresRegistrar } from "./EventRegistrars/MiddlewaresRegistrar"
import { getAllMetadata } from "./globalMetadata"
import { IoCContainer } from "./IoCContainer"
import { TreeRootMetadata } from "./Models/Metadata/Metadata"
import { DataValidationWrapper } from "./Wrappers/DataValidationWrapper"
import { ServerEmitterWrapper } from "./Wrappers/EmitterWrappers/ServerEmitterWrapper"
import { SocketEmitterWrapper } from "./Wrappers/EmitterWrappers/SocketEmitterWrapper"
import { ErrorMiddlewareWrapper } from "./Wrappers/ErrorMiddlewareWrapper"

/**
 * Defines the workflow process responsible for binding all the metadata.
 */
export class SiodWorkflowProcess {
	/**
	 * Processes and binds all the metadata to the controller instances.
	 */
	public static processAll () {
		const metadata = getAllMetadata()

		ErrorMiddlewareWrapper.wrapAllMiddlewares()

		metadata.forEach(m => {
			const controllerInstance = IoCContainer.getInstance<Any>(m.controllerTarget)
			m.controllerInstance = controllerInstance

			SiodWorkflowProcess.bindDataValidation(m)
			SiodWorkflowProcess.bindEmitters(m)
			SiodWorkflowProcess.bindErrorMiddleware(m)
			SiodWorkflowProcess.bindListeners(m)
		})

		MiddlewaresRegistrar.registerAll()
		ListenersRegistrar.applyGroupedSocketEventsRegistration()
	}

	/**
	 * Binds the data validation to the controller listener methods.
	 * @param {TreeRootMetadata} metadata - The metadata of the controller.
	 */
	private static bindDataValidation (metadata: TreeRootMetadata) {
		const listeners = metadata.methodMetadata.map(m => m.metadata.ioMetadata.listenerMetadata).flat()
		DataValidationWrapper.wrapListeners(listeners, metadata.controllerInstance)
	}

	/**
	 * Binds the emitters to the controller emitter methods.
	 * @param {TreeRootMetadata} metadata - The metadata of the controller.
	 */
	private static bindEmitters (metadata: TreeRootMetadata) {
		const emitters = metadata.methodMetadata.map(m => m.metadata.ioMetadata.emitterMetadata).flat()
		ServerEmitterWrapper.wrapEmitters(emitters, metadata.controllerInstance)
		SocketEmitterWrapper.wrapEmitters(emitters, metadata.controllerInstance)
	}

	/**
	 * Binds the listeners to the controller listener methods.
	 * @param {TreeRootMetadata} metadata - The metadata of the controller.
	 */
	private static bindListeners (metadata: TreeRootMetadata) {
		const listeners = metadata.methodMetadata.map(m => m.metadata.ioMetadata.listenerMetadata).flat()
		ListenersRegistrar.registerListeners(listeners, metadata.controllerInstance)
	}

	/**
	 * Wraps the error middleware for the controller.
	 * @param {TreeRootMetadata} metadata - The metadata of the controller.
	 */
	private static bindErrorMiddleware (metadata: TreeRootMetadata) {
		ErrorMiddlewareWrapper.wrapController(metadata)
	}
}