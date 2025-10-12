import { MethodRoomOperations } from "../../MetadataRepository/Operations/MethodRoomOperations"
import { RoomNameGetter } from "../../Models/DecoratorOptions/RoomOptions"

/**
 * Auto join a room when a method is called
 * @param {string | RoomNameGetter} roomName The name of the room to join
 * @returns {MethodDecorator} The decorator function
 */
export function AutoJoinRoom (roomName: string | RoomNameGetter) {
	return function (target: Object, propertyKey: string | symbol) {
		MethodRoomOperations.add({
			target,
			methodName: propertyKey as string,
			roomNameGetter: typeof roomName === "string" ? () => roomName : roomName,
			afterAction: (roomName, socket) => {
				socket.join(roomName)
			}
		})
	}
}