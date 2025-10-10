import { MetadataDescription } from "./Metadata"

export type AppEventMetadata = MetadataDescription & {
	events: AppEventDescription[]
}

export type AppEventDescription = {
	eventName: string
}