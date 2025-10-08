import { Socket } from "socket.io"

/**
 * Defines the context object passed to application event listeners
 */
export type AppEventContext = {
	/**
	 * The name of the application event that triggered the listener
	 */
	eventName: string
	/**
	 * The data associated with the application event
	 * Can be any type of data passed when emitting the event
	 */
	data?: unknown
	/**
	 * Optional Socket.IO context when the event is triggered from a socket handler
	 * Provides access to the current socket instance and original event information
	 */
	ioContext?: {
		/**
		 * The current Socket.IO socket instance
		 * Available when the application event is triggered from a socket event handler
		 */
		currentSocket: Socket | null
		/**
		 * The original Socket.IO event name that triggered the application event
		 * This is the socket event name, not the application event name
		 */
		eventName: string
		/**
		 * The original Socket.IO event data
		 * Array of arguments passed to the original socket event handler
		 */
		eventData: unknown[]
	}
}

/**
 * Defines the type of the application event listener
 */
export type AppEventListener = (context: AppEventContext) => unknown | Promise<unknown>