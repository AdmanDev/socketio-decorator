export type Metadata = {
	type: MetadataType
	action: MetadataAction
	target: Function
	methodName: string
	eventName: string
}

export type ControllerMetadata = {
	controllerInstance: Any
	metadatas: Metadata[]
}

export type MetadataType = "server" | "socket"
export type MetadataAction = "on" | "once"