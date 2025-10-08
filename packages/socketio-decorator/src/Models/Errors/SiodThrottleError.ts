/**
 * Error thrown when a rate limit is exceeded
 */
export class SiodThrottleError extends Error {
	/**
	 * Creates a new ThrottleError instance
	 * @param {number} remainingTime Time in milliseconds until the throttle resets
	 * @param {string} message Error message
	 */
	constructor (
		public readonly remainingTime: number,
		message: string = "Too many requests"
	) {
		super(message)
		this.name = SiodThrottleError.name
	}
}
