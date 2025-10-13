import { MetadataDescription } from "./Metadata"

export type AdapterListenerMetadata = MetadataDescription & {
	action: AdapterEventAction
	roomName?: string
	namespace: string
}

export type AdapterEventAction = "create-room" | "delete-room" | "join-room" | "leave-room"
