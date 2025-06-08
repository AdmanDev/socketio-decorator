/**
 * Defines the error for invalid metadata exception
 */
export class SiodInvalidMetadataError extends Error {
	/**
	 * Initializes a new instance of the SiodInvalidMetadataError.
	 * @param {string} message The error message
	 */
	constructor (message: string) {
		super(message)
		this.name = SiodInvalidMetadataError.name
	}
}