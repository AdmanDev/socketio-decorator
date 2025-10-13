import { AdapterListenerMetadataStore } from "../../MetadataRepository/Stores/AdapterListenerMetadataStore"
import { RoomDecoratorOption, RoomLifecycleEventListener } from "../../Models/DecoratorOptions/RoomDecoratorOption"

/**
 * Register a method as listener for room creation events
 * @param {string | undefined} roomName Optional room name to filter events. If omitted, listens to all room creation events
 * @param {RoomDecoratorOption | undefined} options Optional configuration for the decorator
 * @returns {MethodDecorator} The decorator function
 */
export function OnRoomCreated (roomName?: string, options?: RoomDecoratorOption) {
	return function <T extends RoomLifecycleEventListener>(
		target: Object,
		propertyKey: string,
		descriptor: TypedPropertyDescriptor<T>
	) {
		AdapterListenerMetadataStore.add({
			action: "onRoomCreated",
			target: target,
			methodName: descriptor.value!.name,
			roomName: roomName,
			namespace: options?.namespace || "/",
		})
	}
}
