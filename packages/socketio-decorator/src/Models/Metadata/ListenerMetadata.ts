import { IoMappingMetadata, Metadata } from "./Metadata"

export type ListenerMetadata = IoMappingMetadata & {
	eventName: string
	dataCheck: boolean
}

export type ControllerMetadata = {
	controllerInstance: Any
	metadatas: Metadata[]
}