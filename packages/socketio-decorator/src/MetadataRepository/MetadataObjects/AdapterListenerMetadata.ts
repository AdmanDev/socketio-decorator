import { MetadataDescription } from "./Metadata"

export type AdapterListenerMetadata = MetadataDescription & {
	action: AdapterEventAction
	roomName?: string
	namespace: string
}

export type AdapterEventAction = "onRoomCreated" | "onRoomDeleted" | "onRoomJoined" | "onRoomLeft"
