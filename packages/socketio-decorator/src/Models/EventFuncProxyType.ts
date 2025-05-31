import { Socket } from "socket.io"
import { TreeMethodMetadata } from "./Metadata/Metadata"

/**
 * Defines the arguments for the event func proxy
 */
export class EventFuncProxyArgs {
	/**
	 * Initializes a new instance of the EventFuncProxyArgs class.
	 * @param {unknown[]} args Arguments to pass to the original method
	 * @param {TreeMethodMetadata} methodMetadata The metadata for the method
	 * @param {string} eventName The socket event name
	 * @param {Socket | null} socket Current client socket
	 */
	constructor (
		public args: unknown[],
		public methodMetadata: TreeMethodMetadata,
		public eventName: string,
		public socket: Socket | null
	) {}
}

export type EventFuncProxyType = (proxyArgs: EventFuncProxyArgs) => Promise<unknown>