import { MetadataDescription } from "./Metadata"

export type AdapterListenerMetadata = MetadataDescription & {
	type: "adapter"
	action: AdapterEventAction
	roomName?: string
	namespace: string
}

export type AdapterEventAction = "onRoomJoined"
