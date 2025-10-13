import { Socket } from "socket.io"

/**
 * Options for room adapter decorators
 */
export type RoomDecoratorOption = {
	/**
	 * The namespace to bind the adapter listener to
	 */
	namespace?: string
}

/**
 * Defines room presence event listeners signature
 */
export type RoomPresenceEventListener = (roomName: string, socket: Socket) => Any
export type RoomLifecycleEventListener = (roomName: string) => Any