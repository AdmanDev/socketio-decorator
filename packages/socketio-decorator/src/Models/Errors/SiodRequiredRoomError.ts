/**
 * Defines an error thrown when a socket is not in a required room.
 */
export class SiodRequiredRoomError extends Error {
	/**
	 * Initializes a new instance of the SiodRequiredRoomError.
	 * @param {string} roomName - The name of the required room.
	 * @param {string} socketId - The ID of the socket.
	 */
	constructor (
		public readonly roomName: string,
		public readonly socketId: string
	) {
		super(`The socket ${socketId} is not in the required room: ${roomName}`)
		this.name = SiodRequiredRoomError.name
	}
}