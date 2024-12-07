/**
 * Defines the error for invalid argument exception
 */
export class SiodInvalidArgumentError extends Error {

	/**
	 * Initializes a new instance of the SiodInvalidArgumentError.
	 * @param {string} message The error message
	 */
	constructor (message: string) {
		super(message)
		this.name = SiodInvalidArgumentError.name
	}
}