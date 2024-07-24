export type Metadata = {
	type: MetadataType
	target: Function
	methodName: string
	eventName: string
}

export type ControllerMetadata = {
	controllerInstance: Any
	metadatas: Metadata[]
}

export type MetadataType = "server" | "socket"