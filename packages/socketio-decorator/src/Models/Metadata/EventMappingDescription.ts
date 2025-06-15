import { MetadataDescription } from "./Metadata"

export type EventMappingDescription = MetadataDescription & {
	type: EventMappingType
	action: EventMapAction
}

export type EventMappingType = "server" | "socket"
export type EventMapAction = "on" | "once" | "onAny" | "onAnyOutgoing" | "emitto" | "emitSelf"