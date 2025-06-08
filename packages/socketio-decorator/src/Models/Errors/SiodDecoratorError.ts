/**
 * Defines the error for decorator exception
 */
export class SiodDecoratorError extends Error {

	/**
	 * Initializes a new instance of the SiodDecoratorError.
	 * @param {string} message The error message
	 */
	constructor (message: string) {
		super(message)
		this.name = SiodDecoratorError.name
	}
}