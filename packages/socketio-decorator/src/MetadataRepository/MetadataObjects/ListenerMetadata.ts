import { EventMappingDescription } from "./EventMappingDescription"

export type ListenerMetadata = EventMappingDescription & {
	eventName: string
	dataCheck: boolean
}