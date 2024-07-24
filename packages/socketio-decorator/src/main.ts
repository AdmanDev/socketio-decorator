import { useMetadata } from "./binders/metadataBinder"
import { useServerMiddleware } from "./binders/middlewareBinders"
import { SiodConfig } from "./types/SiodConfig"

/**
 * Enables the socket.io decorator system
 * @param {SiodConfig} config The socketio decocator configuration
 */
export function useSocketDecorator (config: SiodConfig): void {
	useServerMiddleware(config)
	useMetadata(config)
}