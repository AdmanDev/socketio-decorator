import { EmitterMetadata } from "./EmiterMetadata"
import { ListenerMetadata } from "./ListenerMetadata"
import { SocketMiddlewareMetadata, ClassSocketMiddlewareMetadata } from "./MiddlewareMetadata"

export type ControllerMetadata = {
	controllerTarget: new () => Any
	controllerInstance?: Any
	controllerName: string
	methodMetadata: MethodMetadata[]
	middlewaresMetadata: ClassSocketMiddlewareMetadata[]
}

export type MethodMetadata = {
	methodName: string
	metadata: MethodMetadataItem
}

type MethodMetadataItem = {
	ioMetadata: {
		listenerMetadata: ListenerMetadata[]
		emitterMetadata: EmitterMetadata[]
	}
	socketMiddlewareMetadata: SocketMiddlewareMetadata[]
}

export type MetadataDescription = {
	target: Object
	methodName: string
}