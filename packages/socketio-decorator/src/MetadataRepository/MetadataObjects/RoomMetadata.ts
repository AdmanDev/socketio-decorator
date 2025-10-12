import { Socket } from "socket.io"
import { RoomNameGetter } from "../../Models/DecoratorOptions/RoomOptions"
import { MetadataDescription } from "./Metadata"

type RoomAction = (roomName: string, socket: Socket) => void | Promise<void>

export type MethodRoomMetadata = MetadataDescription & {
	roomNameGetter: RoomNameGetter
	beforeAction?: RoomAction
	afterAction?: RoomAction
}