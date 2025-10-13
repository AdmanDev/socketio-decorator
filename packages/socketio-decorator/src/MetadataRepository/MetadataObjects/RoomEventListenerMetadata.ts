import { MetadataDescription } from "./Metadata"

export type RoomEventListenerMetadata = MetadataDescription & {
	action: RoomEventAction
	roomName?: string
	namespace: string
}

export type RoomEventAction = "create-room" | "delete-room" | "join-room" | "leave-room"
