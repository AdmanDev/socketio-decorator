import "reflect-metadata"
import { setConfig } from "./globalMetadata"
import { SiodConfig } from "./Models/SiodConfig"
import { DataValidationWrapper } from "./Wrappers/DataValidationWrapper"
import { ServerEmitterWrapper } from "./Wrappers/EmitterWrappers/ServerEmitterWrapper"
import { SocketEmitterWrapper } from "./Wrappers/EmitterWrappers/SocketEmitterWrapper"
import { ErrorMiddlewareWrapper } from "./Wrappers/ErrorMiddlewareWrapper"
import { MiddlewaresRegistrar } from "./EventRegistrars/MiddlewaresRegistrar"
import { ListenersRegistrar } from "./EventRegistrars/ListenersRegistrar"

/**
 * Enables the socket.io decorator system
 * @param {SiodConfig} config The socketio decocator configuration
 */
export function useSocketIoDecorator (config: SiodConfig) {
	setConfig(config)

	DataValidationWrapper.wrapAllListeners()
	wrapEmitters()
	ErrorMiddlewareWrapper.wrapAllControllersAndMiddlewares()
	MiddlewaresRegistrar.registerAll()
	ListenersRegistrar.registerListeners()
	ListenersRegistrar.registerSocketEvents()
}

/**
 * Wraps all server and socket emitters to add custom logic.
 */
function wrapEmitters () {
	ServerEmitterWrapper.wrapAllEmitters()
	SocketEmitterWrapper.wrapAllEmitters()
}
