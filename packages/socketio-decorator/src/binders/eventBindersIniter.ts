import { getAllEventBinders } from "../globalMetadata"
import { SiodConfig } from "../types/SiodConfig"

/**
 * Use events binder
 * @param {SiodConfig} config The socketio decocator configuration
 */
export function useEventBinders (config: SiodConfig) {
	const binderEvents = getAllEventBinders()
	Object.keys(binderEvents)
		.forEach(event => {
			config.ioserver.on(event, (socket) => {
				binderEvents[event].forEach(method => method(socket))
			})
		})
}