import "reflect-metadata"
import { ConfigStore } from "./MetadataRepository/Stores/ConfigStore"
import { SiodConfig } from "./Models/SiodConfig"
import { SiodWorkflowProcess } from "./SiodWorkflowProccess"
import { ModuleUtils } from "./Utils/ModuleUtils"

/**
 * Enables the socket.io decorator system
 * @param {SiodConfig} config The socketio decocator configuration
 */
export async function useSocketIoDecorator (config: SiodConfig) {
	const updatedConfig = await ModuleUtils.resolveAutoImportFromConfig(config)
	ConfigStore.set(updatedConfig)
	SiodWorkflowProcess.processAll()
}
