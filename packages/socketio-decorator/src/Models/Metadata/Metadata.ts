import { EmitterMetadata } from "./EmiterMetadata"
import { ListenerMetadata } from "./ListenerMetadata"
import { SocketMiddlewareMetadata } from "./MiddlewareMetadata"

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
	socketMiddlewareMetadata: SocketMiddlewareMetadata[]
}

export type Metadata = {
	target: Object
	methodName: string
}

export type IoMappingMetadata = Metadata & {
	type: MetadataType
	action: MetadataAction
}

export type MetadataType = "server" | "socket"
export type MetadataAction = "on" | "once" | "onAny" | "onAnyOutgoing" | "emitto" | "emitSelf"