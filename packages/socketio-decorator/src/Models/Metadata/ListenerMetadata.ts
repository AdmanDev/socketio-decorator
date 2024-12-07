import { Metadata } from "./Metadata"

export type ListenerMetadata = Metadata & {
	eventName: string
}

export type ControllerMetadata = {
	controllerInstance: Any
	metadatas: Metadata[]
}