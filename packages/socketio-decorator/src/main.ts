import "reflect-metadata"
import { setConfig } from "./globalMetadata"
import { SiodConfig } from "./Models/SiodConfig"
import { SiodWorkflowProcess } from "./SiodWorkflowProccess"
import { ModuleUtils } from "./Utils/ModuleUtils"

/**
 * Enables the socket.io decorator system
 * @param {SiodConfig} config The socketio decocator configuration
 */
export async function useSocketIoDecorator (config: SiodConfig) {
	const updatedConfig = await ModuleUtils.resolveAutoImportFromConfig(config)
	setConfig(updatedConfig)
	SiodWorkflowProcess.processAll()
}
