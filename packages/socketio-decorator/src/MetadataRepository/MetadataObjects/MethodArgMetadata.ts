import { SocketRoomOption } from "../../Models/DecoratorOptions/RoomDecoratorOption"

export type MethodArgMetadata = {
	parameterIndex: number
} & (
	{
		valueType: "socket"
	} | {
		valueType: "data"
		dataIndex: number
	} | {
		valueType: "eventName"
	} | {
		valueType: "currentUser"
	} | {
		valueType: "socketDataAttribute"
		dataKey?: string
	} | {
		valueType: "room"
		roomName?: string
		option?: SocketRoomOption
	}
)

export type MethodArgValueType = MethodArgMetadata["valueType"]