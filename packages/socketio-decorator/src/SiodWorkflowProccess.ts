import { ListenersRegistrar } from "./EventRegistrars/ListenersRegistrar"
import { MiddlewaresRegistrar } from "./EventRegistrars/MiddlewaresRegistrar"
import { config, getAllMetadata } from "./globalMetadata"
import { IoCContainer } from "./IoCContainer"
import { TreeMethodMetadata, TreeRootMetadata } from "./Models/Metadata/Metadata"
import { DataValidationWrapper } from "./Wrappers/DataValidationWrapper"
import { ServerEmitterWrapper } from "./Wrappers/EmitterWrappers/ServerEmitterWrapper"
import { SocketEmitterWrapper } from "./Wrappers/EmitterWrappers/SocketEmitterWrapper"
import { ErrorMiddlewareWrapper } from "./Wrappers/ErrorMiddlewareWrapper"
import { EventFuncProxyWrapper } from "./Wrappers/EventFuncProxyWrapper"
import { SocketMiddlewareDecoratorWrapper } from "./Wrappers/Middlewares/SocketMiddlewareDecoratorWrapper"

/**
 * Defines the workflow process responsible for binding all the metadata.
 */
export class SiodWorkflowProcess {
	/**
	 * Processes and binds all the metadata to the controller instances.
	 */
	public static processAll () {
		const metadata = getAllMetadata()
			.filter(m => config.controllers.includes(m.controllerTarget))

		ErrorMiddlewareWrapper.wrapAllMiddlewares()

		metadata.forEach(m => {
			const controllerInstance = IoCContainer.getInstance<Any>(m.controllerTarget)
			m.controllerInstance = controllerInstance

			SiodWorkflowProcess.bindLastChainProxy(m)

			SiodWorkflowProcess.bindDataValidation(m)
			SiodWorkflowProcess.bindEmitters(m)
			SiodWorkflowProcess.bindUseSocketMiddlewareDecorator(m)
			SiodWorkflowProcess.bindErrorMiddleware(m)

			SiodWorkflowProcess.bindFirstChainProxy(m)

			SiodWorkflowProcess.bindListeners(m)
		})

		MiddlewaresRegistrar.registerAll()
		ListenersRegistrar.applyGroupedSocketEventsRegistration()
	}

	/**
	 * Binds with the last chain last proxy to the controller methods.
	 * @param {TreeRootMetadata} metadata - The metadata of the controller.
	 */
	private static bindLastChainProxy (metadata: TreeRootMetadata) {
		metadata.methodMetadata.forEach(methodMetadata => {
			EventFuncProxyWrapper.addLastProxyLayer(metadata.controllerInstance, methodMetadata.methodName)
		})
	}

	/**
	 * Binds with the first chain last proxy to the controller methods.
	 * @param {TreeRootMetadata} metadata - The metadata of the controller.
	 */
	private static bindFirstChainProxy (metadata: TreeRootMetadata) {
		metadata.methodMetadata.forEach(methodMetadata => {
			EventFuncProxyWrapper.addFirstProxyLayer(metadata.controllerInstance, methodMetadata.methodName)
		})
	}

	/**
	 * Binds the data validation to the controller listener methods.
	 * @param {TreeRootMetadata} metadata - The metadata of the controller.
	 */
	private static bindDataValidation (metadata: TreeRootMetadata) {
		const listeners = metadata.methodMetadata.flatMap(m => m.metadata.ioMetadata.listenerMetadata)
		DataValidationWrapper.wrapListeners(listeners, metadata.controllerInstance)
	}

	/**
	 * Binds the emitters to the controller emitter methods.
	 * @param {TreeRootMetadata} metadata - The metadata of the controller.
	 */
	private static bindEmitters (metadata: TreeRootMetadata) {
		const emitters = metadata.methodMetadata.flatMap(m => m.metadata.ioMetadata.emitterMetadata)
		ServerEmitterWrapper.wrapEmitters(emitters, metadata.controllerInstance)
		SocketEmitterWrapper.wrapEmitters(emitters, metadata.controllerInstance)
	}

	/**
	 * Binds the listeners to the controller listener methods.
	 * @param {TreeMethodMetadata} metadata - The metadata of the controller.
	 */
	private static bindListeners (metadata: TreeRootMetadata) {
		ListenersRegistrar.registerListeners(metadata.methodMetadata, metadata.controllerInstance)
	}

	/**
	 * Binds the socket middleware decorator to the controller methods.
	 * @param {TreeRootMetadata} metadata - The metadata of the controller.
	 */
	private static bindUseSocketMiddlewareDecorator (metadata: TreeRootMetadata) {
		const socketMiddlewareDecoratorMetadata = metadata.methodMetadata.flatMap(m => m.metadata.socketMiddlewareMetadata)

		SocketMiddlewareDecoratorWrapper.addMethodSocketMiddleware(socketMiddlewareDecoratorMetadata, metadata.controllerInstance)
		SocketMiddlewareDecoratorWrapper.addSocketMiddlewareToManyClassMethods(metadata)
	}

	/**
	 * Wraps the error middleware for the controller.
	 * @param {TreeRootMetadata} metadata - The metadata of the controller.
	 */
	private static bindErrorMiddleware (metadata: TreeRootMetadata) {
		ErrorMiddlewareWrapper.wrapController(metadata)
	}
}