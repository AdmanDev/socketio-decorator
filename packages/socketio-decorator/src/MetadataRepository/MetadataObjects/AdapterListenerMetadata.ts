import { MetadataDescription } from "./Metadata"

export type AdapterListenerMetadata = MetadataDescription & {
	action: AdapterEventAction
	roomName?: string
	namespace: string
}

export type AdapterEventAction = "onRoomJoined" | "onRoomLeft"
