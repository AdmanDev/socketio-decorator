/**
 * Define the option for the emitter decorators (must be returned by the method)
 */
export class EmitterOption {
	/**
	 * Allows to disable the emit. If true, the emit will not be executed
	 */
	disableEmit?: boolean
	/**
	 * The event destinataire
	 */
	to?: string
	/**
	 * The message to send
	 */
	message: string
	/**
	 * The data to send
	 */
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