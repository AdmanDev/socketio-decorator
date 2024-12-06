import "reflect-metadata"
import { useEventBinders } from "./binders/eventBindersIniter"
import { bindEmitterMetadata } from "./binders/metadata/emitterMetadataBinder"
import { bindListenerMetadata } from "./binders/metadata/listenerMetadataBinder"
import { bindErrorMiddleware, bindServerMiddlewares, bindSocketMiddlewares } from "./binders/middlewareBinders"
import { setConfig } from "./globalMetadata"
import { SiodConfig } from "./types/SiodConfig"
import { addDataValidation } from "./binders/metadata/dataValidationBinder"

/**
 * Enables the socket.io decorator system
 * @param {SiodConfig} config The socketio decocator configuration
 */
export function useSocketIoDecorator (config: SiodConfig) {
	setConfig(config)

	addDataValidation(config)
	configureMiddlewares(config)
	bindEmitterMetadata(config)
	confugureListeners(config)
	bindErrorMiddleware(config)
}

/**
 * Configures the middlewares
 * @param {SiodConfig} config The socketio decocator configuration
 */
function configureMiddlewares (config: SiodConfig) {
	bindServerMiddlewares(config)
	bindSocketMiddlewares(config)
}

/**
 * Configures the listeners
 * @param {SiodConfig} config The socketio decocator configuration
 */
function confugureListeners (config: SiodConfig) {
	bindListenerMetadata(config)
	useEventBinders(config)
}