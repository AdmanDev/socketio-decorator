import { AdapterListenerMetadataStore } from "../../MetadataRepository/Stores/AdapterListenerMetadataStore"
import { RoomDecoratorOption, RoomEventListener } from "../../Models/DecoratorOptions/RoomDecoratorOption"

/**
 * Register a method as listener for room join events
 * The decorated method must have the signature: (roomName: string, socket: Socket) => Any
 * @param {string | undefined} roomName Optional room name to filter events. If omitted, listens to all room join events
 * @param {RoomDecoratorOption | undefined} options Optional configuration for the decorator
 * @returns {MethodDecorator} The decorator function
 */
export function OnRoomJoined (roomName?: string, options?: RoomDecoratorOption) {
	return function <T extends RoomEventListener>(
		target: Object,
		propertyKey: string,
		descriptor: TypedPropertyDescriptor<T>
	) {
		AdapterListenerMetadataStore.add({
			action: "onRoomJoined",
			target: target,
			methodName: descriptor.value!.name,
			roomName: roomName,
			namespace: options?.namespace || "/",
		})
	}
}