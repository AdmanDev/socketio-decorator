import { EventMappingDescription } from "./EventMappingDescription"

export type EmitterMetadata = EventMappingDescription & {
	to: string
	message: string
}