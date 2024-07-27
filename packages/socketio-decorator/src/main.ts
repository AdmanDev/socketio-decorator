import { useBinderEvent } from "./binders/binderEventIniter"
import { bindEmitterMetadata } from "./binders/metadata/emitterMetadataBinder"
import { bindListenerMetadata } from "./binders/metadata/listenerMetadataBinder"
import { bindServerMiddlewares, bindSocketMiddlewares } from "./binders/middlewareBinders"
import { setIoServer } from "./globalMetadata"
import { SiodConfig } from "./types/SiodConfig"

/**
 * Enables the socket.io decorator system
 * @param {SiodConfig} config The socketio decocator configuration
 */
export function useSocketIoDecorator (config: SiodConfig) {
	setIoServer(config.ioserver)

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