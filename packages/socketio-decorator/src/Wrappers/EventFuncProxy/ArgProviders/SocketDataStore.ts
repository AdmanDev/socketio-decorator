import { Socket } from "socket.io"

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface SocketDataAttributes {}

/**
 * Defines a store for socket data attributes to manage custom socket data.
 * @template DataType The type of data attributes stored in the socket data store.
 */
export class SocketDataStore<DataType extends SocketDataAttributes = Record<string, unknown>> {
	/**
	 * Creates an instance of the SocketDataStore.
	 * @param {Socket} socket The socket instance to interact with socket data.
	 */
	constructor (private socket: Socket) {}

	/**
	 * Gets a data attribute from the socket.
	 * @param {string} key The key of the data attribute to retrieve.
	 * @returns {unknown | null} The value of the data attribute, or null if not found.
	 * @template K The expected key type of the data attribute.
	 */
	public getData<K extends keyof DataType>(key: K): DataType[K] | null {
		return this.socket.data[key] || null
	}

	/**
	 * Sets a data attribute on the socket.
	 * @param {K} key The key of the data attribute to set.
	 * @param {unknown} value The value to set for the data attribute.
	 * @template K The key type of the data attribute.
	 */
	public setData<K extends keyof DataType>(key: K, value: DataType[K]): void {
		this.socket.data[key] = value
	}

	/**
	 * Removes a data attribute from the socket.
	 * @param {K} key The key of the data attribute to remove.
	 * @template K The key type of the data attribute.
	 */
	public removeData<K extends keyof DataType>(key: K): void {
		delete this.socket.data[key]
	}

	/**
	 * Determines if a data attribute exists on the socket.
	 * @param {K} key The key of the data attribute to check.
	 * @returns {boolean} True if the data attribute exists, false otherwise.
	 * @template K The key type of the data attribute.
	 */
	public hasData<K extends keyof DataType>(key: K): boolean {
		return key in this.socket.data
	}
}