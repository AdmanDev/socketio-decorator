import { Socket } from "socket.io"

/**
 * Defines a store for socket data attributes to manage custom socket data.
 */
export class SocketDataStore {
	/**
	 * Creates an instance of the SocketDataStore.
	 * @param {Socket} socket The socket instance to interact with socket data.
	 */
	constructor (private socket: Socket) {}

	/**
	 * Gets a data attribute from the socket.
	 * @param {string} key The key of the data attribute to retrieve.
	 * @returns {TResult | null} The value of the data attribute, or null if not found.
	 * @template TResult The expected type of the data attribute.
	 */
	public getData<TResult> (key: string): TResult | null {
		return this.socket.data[key] || null
	}

	/**
	 * Sets a data attribute on the socket.
	 * @param {string} key The key of the data attribute to set.
	 * @param {unknown} value The value to set for the data attribute.
	 */
	public setData (key: string, value: unknown): void {
		this.socket.data[key] = value
	}

	/**
	 * Removes a data attribute from the socket.
	 * @param {string} key The key of the data attribute to remove.
	 */
	public removeData (key: string): void {
		delete this.socket.data[key]
	}

	/**
	 * Determines if a data attribute exists on the socket.
	 * @param {string} key The key of the data attribute to check.
	 * @returns {boolean} True if the data attribute exists, false otherwise.
	 */
	public hasData (key: string): boolean {
		return key in this.socket.data
	}
}