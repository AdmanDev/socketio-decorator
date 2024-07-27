import { Metadata } from "./metadata"

export type ListenerMetadata = Metadata & {
	eventName: string
}

export type ControllerMetadata = {
	controllerInstance: Any
	metadatas: Metadata[]
}