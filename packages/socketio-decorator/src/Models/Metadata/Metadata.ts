import { EmitterMetadata } from "./EmiterMetadata"
import { ListenerMetadata } from "./ListenerMetadata"

export type TreeRootMetadata = {
	controllerTarget: new () => Any
	controllerInstance?: Any
	controllerName: string
	methodMetadata: TreeMethodMetadata[]
}

export type TreeMethodMetadata = {
	methodName: string
	metadata: TreeMethodMetadataItem
}

export type TreeMethodMetadataItem = {
	ioMetadata: {
		listenerMetadata: ListenerMetadata[]
		emitterMetadata: EmitterMetadata[]
	}
}

export type Metadata = {
	type: MetadataType
	action: MetadataAction
	target: Object
	methodName: string
	dataCheck: boolean
}

export type MetadataType = "server" | "socket"
export type MetadataAction = "on" | "once" | "onAny" | "onAnyOutgoing" | "emitto" | "emitSelf"