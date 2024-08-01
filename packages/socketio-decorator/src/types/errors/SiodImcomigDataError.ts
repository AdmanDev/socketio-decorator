/**
 * Defines the error for incoming data exception
 */
export class SiodImcomigDataError extends Error {
	/**
	 * The incoming data that caused the error
	 */
	public dataValue: unknown

	/**
	 * Initializes a new instance of the Siod error.
	 * @param {string} message The error message
	 * @param {unknown} data The incoming data that caused the error
	 * @param {Error} cause The error cause
	 */
	constructor (message: string, data?: unknown, cause?: Error) {
		super(message, { cause })
		this.name = "SiodImcomigDataError"
		this.dataValue = data
	}
}