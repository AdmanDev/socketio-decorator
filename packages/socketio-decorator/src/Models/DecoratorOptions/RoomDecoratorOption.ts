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
 * Defines room event listeners signature
 */
export type RoomEventListener = (roomName: string, socket: Socket) => Any
export type RoomLifecycleEventListener = (roomName: string) => Any