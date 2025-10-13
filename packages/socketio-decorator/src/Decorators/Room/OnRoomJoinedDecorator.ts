import { RoomEventListenerMetadataStore } from "../../MetadataRepository/Stores/RoomEventListenerMetadataStore"
import { RoomDecoratorOption, RoomPresenceEventListener } from "../../Models/DecoratorOptions/RoomDecoratorOption"

/**
 * Register a method as listener for room join events
 * @param {string | undefined} roomName Optional room name to filter events. If omitted, listens to all room join events
 * @param {RoomDecoratorOption | undefined} options Optional configuration for the decorator
 * @returns {MethodDecorator} The decorator function
 */
export function OnRoomJoined (roomName?: string, options?: RoomDecoratorOption) {
	return function <T extends RoomPresenceEventListener>(
		target: Object,
		propertyKey: string,
		descriptor: TypedPropertyDescriptor<T>
	) {
		RoomEventListenerMetadataStore.add({
			action: "join-room",
			target: target,
			methodName: descriptor.value!.name,
			roomName: roomName,
			namespace: options?.namespace || "/",
		})
	}
}