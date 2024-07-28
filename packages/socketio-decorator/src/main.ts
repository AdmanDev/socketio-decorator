import { useBinderEvent } from "./binders/binderEventIniter"
import { bindEmitterMetadata } from "./binders/metadata/emitterMetadataBinder"
import { bindListenerMetadata } from "./binders/metadata/listenerMetadataBinder"
import { bindErrorMiddleware, bindServerMiddlewares, bindSocketMiddlewares } from "./binders/middlewareBinders"
import { setConfig } from "./globalMetadata"
import { SiodConfig } from "./types/SiodConfig"

/**
 * Enables the socket.io decorator system
 * @param {SiodConfig} config The socketio decocator configuration
 */
export function useSocketIoDecorator (config: SiodConfig) {
	setConfig(config)

	bindErrorMiddleware(config)
	confugureListeners(config)
	bindEmitterMetadata(config)
}

/**
 * Configures the listeners
 * @param {SiodConfig} config The socketio decocator configuration
 */
function confugureListeners (config: SiodConfig) {
	bindServerMiddlewares(config)
	bindSocketMiddlewares(config)
	bindListenerMetadata(config)
	useBinderEvent(config)
}