import { AdapterListenerMetadataStore } from "../../MetadataRepository/Stores/AdapterListenerMetadataStore"
import { RoomDecoratorOption, RoomEventListener } from "../../Models/DecoratorOptions/RoomDecoratorOption"

/**
 * Register a method as listener for room leave events
 * @param {string | undefined} roomName Optional room name to filter events. If omitted, listens to all room leave events
 * @param {RoomDecoratorOption | undefined} options Optional configuration for the decorator
 * @returns {MethodDecorator} The decorator function
 */
export function OnRoomLeft (roomName?: string, options?: RoomDecoratorOption) {
	return function <T extends RoomEventListener>(
		target: Object,
		propertyKey: string,
		descriptor: TypedPropertyDescriptor<T>
	) {
		AdapterListenerMetadataStore.add({
			action: "onRoomLeft",
			target: target,
			methodName: descriptor.value!.name,
			roomName: roomName,
			namespace: options?.namespace || "/",
		})
	}
}
