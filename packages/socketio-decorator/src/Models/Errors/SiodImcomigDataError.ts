import { ValidationError } from "class-validator"

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
	 * @param {ValidationError[]} validationErrors The validation errors
	 */
	constructor (message: string, data?: unknown, validationErrors?: ValidationError[]) {
		super(message, { cause: validationErrors })
		this.name = SiodImcomigDataError.name
		this.dataValue = data
	}
}