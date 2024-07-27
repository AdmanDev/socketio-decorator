/**
 * Define the option for the emitter decorators (must be returned by the method)
 */
export class EmitterOption {
	disableEmit?: boolean
	to?: string
	message?: string
	data: unknown

	/**
	 * Constructor
	 * @param {EmitterOption} options The options
	 */
	constructor (options: EmitterOption) {
		this.data = options.data
		this.message = options.message
		this.to = options.to
		this.disableEmit = options.disableEmit
	}
}