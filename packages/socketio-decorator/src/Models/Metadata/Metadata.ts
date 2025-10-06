import { EmitterMetadata } from "./EmitterMetadata"
import { ListenerMetadata } from "./ListenerMetadata"
import { MethodArgMetadata } from "./MethodArgMetadata"
import { SocketMiddlewareMetadata, ClassSocketMiddlewareMetadata } from "./MiddlewareMetadata"
import { ClassThrottleMetadata, ThrottleMetadata } from "./ThrottleMetadata"

export type ControllerMetadata = {
	controllerTarget: new () => Any
	controllerInstance?: Any
	controllerName: string
	namespace: string
	methodMetadata: MethodMetadata[]
	middlewaresMetadata: ClassSocketMiddlewareMetadata[]
	throttleMetadata?: ClassThrottleMetadata
}

export type MethodMetadata = {
	methodName: string
	metadata: MethodMetadataItem
	argsMetadata: MethodArgMetadata[]
}

type MethodMetadataItem = {
	ioMetadata: {
		listenerMetadata: ListenerMetadata[]
		emitterMetadata: EmitterMetadata[]
	}
	socketMiddlewareMetadata: SocketMiddlewareMetadata[]
	throttleMetadata?: ThrottleMetadata
}

export type MetadataDescription = {
	target: Object
	methodName: string
}