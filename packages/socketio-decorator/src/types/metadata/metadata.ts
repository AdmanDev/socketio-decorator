export type Metadata = {
	type: MetadataType
	action: MetadataAction
	target: Function
	methodName: string
}

export type MetadataType = "server" | "socket"
export type MetadataAction = "on" | "once" | "onAny" | "onAnyOutgoing" | "emitto" | "emitSelf"