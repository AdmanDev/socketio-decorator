import { getAllBinderEvents } from "../globalMetadata"
import { SiodConfig } from "../types/SiodConfig"

/**
 * Use binder events
 * @param {SiodConfig} config The socketio decocator configuration
 */
export function useBinderEvent (config: SiodConfig) {
	const binderEvents = getAllBinderEvents()
	Object.keys(binderEvents)
		.forEach(event => {
			config.ioserver.on(event, (socket) => {
				binderEvents[event].forEach(method => method(socket))
			})
		})
}