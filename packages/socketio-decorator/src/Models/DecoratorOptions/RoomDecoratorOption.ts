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

/**
 * Defines room lifecycle event listeners signature
 */
export type RoomLifecycleEventListener = (roomName: string) => Any

/**
 * Defines options for the SocketRoom decorator
 */
export type SocketRoomOption = {
	/**
	 * If true, throws an SiodRequiredRoomError if the socket is not in the specified room
	 */
	required?: boolean
}