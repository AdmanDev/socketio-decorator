import "reflect-metadata"
import { setConfig } from "./globalMetadata"
import { SiodConfig } from "./Models/SiodConfig"
import { SiodWorkflowProcess } from "./SiodWorkflowProccess"

/**
 * Enables the socket.io decorator system
 * @param {SiodConfig} config The socketio decocator configuration
 */
export function useSocketIoDecorator (config: SiodConfig) {
	setConfig(config)
	SiodWorkflowProcess.processAll()
}
