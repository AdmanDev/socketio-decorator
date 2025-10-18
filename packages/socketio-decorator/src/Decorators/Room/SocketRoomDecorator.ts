import { MethodArgOperations } from "../../MetadataRepository/Operations/MethodArgOperations"
import { MethodArgMetadata } from "../../MetadataRepository/MetadataObjects/MethodArgMetadata"
import { SocketRoomOption } from "../../Models/DecoratorOptions/RoomDecoratorOption"

/**
 * Injects into a method parameter the room(s) the current socket is in.
 * If the room name is not specified, injects an array of all rooms' the socket is part of.
 * @param {string | undefined} roomName - The name of the room to inject data from.
 * @param {SocketRoomOption | undefined} option - Options for the decorator.
 * @returns {Function} The decorator function.
 */
export function SocketRoom (roomName?: string, option?: SocketRoomOption) {
	return (target: Object, propertyKey: string, parameterIndex: number) => {
		const argMetadata: MethodArgMetadata = {
			valueType: "room",
			parameterIndex,
			roomName,
			option,
		}

		MethodArgOperations.add(target, propertyKey, argMetadata)
	}
}