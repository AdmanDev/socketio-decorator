/**
 * Store for managing socket.io rooms
 * @template TRoom The type of the room
 */
export class RoomStore<TRoom> {
	private rooms: Map<string, TRoom> = new Map()

	/**
	 * Get a room by its id
	 * @param {string} roomId The id of the room
	 * @returns {TRoom | null} The room or null if the room does not exist
	 */
	public getRoom (roomId: string): TRoom | null {
		return this.rooms.get(roomId) || null
	}

	/**
	 * Add a room to the store
	 * If the room already exists, it will do nothing
	 * @param {string} roomId The id of the room
	 * @param {TRoom} room The room to add
	 */
	public addRoom (roomId: string, room: TRoom): void {
		if (this.rooms.has(roomId)) {
			return
		}

		this.rooms.set(roomId, room)
	}

	/**
	 * Remove a room from the store
	 * @param {string} roomId The id of the room
	 * @returns {boolean} True if the room was removed, false otherwise
	 */
	public removeRoom (roomId: string): boolean {
		return this.rooms.delete(roomId)
	}

	/**
	 * Clear all rooms from the store
	 */
	public clearAllRooms (): void {
		this.rooms.clear()
	}
}