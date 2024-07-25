import { useBinderEvent } from "./binders/binderEventIniter"
import { useMetadata } from "./binders/metadataBinder"
import { useServerMiddlewares, useSocketMiddlewares } from "./binders/middlewareBinders"
import { setIoServer } from "./globalMetadata"
import { SiodConfig } from "./types/SiodConfig"

/**
 * Enables the socket.io decorator system
 * @param {SiodConfig} config The socketio decocator configuration
 */
export function useSocketIoDecorator (config: SiodConfig): void {
	setIoServer(config.ioserver)

	useServerMiddlewares(config)
	useSocketMiddlewares(config)
	useMetadata(config)
	useBinderEvent(config)
}