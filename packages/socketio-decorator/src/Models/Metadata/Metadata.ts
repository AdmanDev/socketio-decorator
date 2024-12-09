export type Metadata = {
	type: MetadataType
	action: MetadataAction
	target: Object
	methodName: string
	dataCheck: boolean
}

export type MetadataType = "server" | "socket"
export type MetadataAction = "on" | "once" | "onAny" | "onAnyOutgoing" | "emitto" | "emitSelf"