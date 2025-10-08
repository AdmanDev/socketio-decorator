import { IoEventsBinder } from "./EventRegistrars/IoEventsBinder"
import { MiddlewaresRegistrar } from "./EventRegistrars/MiddlewaresRegistrar"
import { ConfigStore } from "./MetadataRepository/Stores/ConfigStore"
import { ControllerMetadataStore } from "./MetadataRepository/Stores/ControllerMetadataStore"
import { DataValidationWrapper } from "./Wrappers/DataValidationWrapper"
import { ServerEmitterWrapper } from "./Wrappers/EmitterWrappers/ServerEmitterWrapper"
import { SocketEmitterWrapper } from "./Wrappers/EmitterWrappers/SocketEmitterWrapper"
import { ArgsInjector } from "./Wrappers/EventFuncProxy/ArgsInjector"
import { ArgsNormalizer } from "./Wrappers/EventFuncProxy/ArgsNormalizer"
import { ListenerRegistration } from "./Wrappers/ListenerRegistration"
import { BaseErrorMiddlewareWrapper } from "./Wrappers/Middlewares/ErrorMiddlewares/BaseErrorMiddlewareWrapper"
import { ControllerErrorWrapper } from "./Wrappers/Middlewares/ErrorMiddlewares/ControllerErrorWrapper"
import { SocketMiddlewareDecoratorWrapper } from "./Wrappers/Middlewares/SocketMiddlewareDecoratorWrapper"
import { ThrottleManager } from "./Wrappers/throttle/ThrottleManager"
import { ThrottleWrapper } from "./Wrappers/throttle/ThrottleWrapper"
import { WrapperChain } from "./Wrappers/WrapperCore/WrapperChain"

/**
 * Defines the workflow process responsible for binding all the metadata.
 */
export class SiodWorkflowProcess {
	/**
	 * Processes and binds all the metadata to the controller instances.
	 */
	public static processAll () {
		const metadata = ControllerMetadataStore
			.getAll()
			.filter(m => ConfigStore.get().controllers.some(controller => typeof controller === "function" && controller === m.controllerTarget))

		BaseErrorMiddlewareWrapper.wrapAllMiddlewares()

		const wrapperChain = new WrapperChain()
			.register(new ArgsInjector())
			.register(new DataValidationWrapper())
			.register(new ServerEmitterWrapper())
			.register(new SocketEmitterWrapper())
			.register(new SocketMiddlewareDecoratorWrapper())
			.register(new ThrottleWrapper())
			.register(new ControllerErrorWrapper())
			.register(new ArgsNormalizer())
			.register(new ListenerRegistration())

		wrapperChain.execute(metadata)

		MiddlewaresRegistrar.registerAll()
		IoEventsBinder.bindAll()

		ThrottleManager.startPeriodicCleanup(ConfigStore.get().throttleConfig?.cleanupIntervalMs)
	}
}