import { EmitterOption } from "../../Models/DecoratorOptions/EmitterOption"
import { SiodInvalidArgumentError } from "../../Models/Errors/SiodInvalidArgumentError"
import { EmitterMetadata } from "../../Models/Metadata/EmitterMetadata"

/**
 * Defines utils for emitter wrappers
 */
export class EmitterWrapperUtils {
	/**
	 * Determines if an event can be emitted based on the emitter option.
	 * @param {EmitterOption} emitterOption - The options for the emitter.
	 * @returns {boolean} - Returns true if the event can be emitted; false otherwise.
	 * @throws {SiodInvalidArgumentError} - If the message is undefined.
	 */
	public static canEmit (emitterOption: EmitterOption) {
		const { data, message, disableEmit } = emitterOption

		if (!message) {
			throw new SiodInvalidArgumentError("The socket message cannot be empty")
		}

		return !disableEmit && data
	}

	/**
	 * Gets the emitter options
	 * @param {EmitterMetadata} metadata The emitter metadata
	 * @param {unknown} methodResult The method result
	 * @returns {EmitterOption[]} The emitter options
	 */
	public static getEmitterOptions (metadata: EmitterMetadata, methodResult: unknown) {
		const { to, message } = metadata

		const emitterOptionsCollection: EmitterOption[] = []

		if (Array.isArray(methodResult) && methodResult.every(option => option instanceof EmitterOption)) {
			emitterOptionsCollection.push(
				...methodResult.map((option) => EmitterWrapperUtils.getNormalizeOption(option, to, message))
			)
		} else {
			emitterOptionsCollection.push(EmitterWrapperUtils.getNormalizeOption(methodResult, to, message))
		}

		return emitterOptionsCollection
	}

	/**
	 * Normalizes the given option, resolving and merging its properties with the provided defaults.
	 * @param {unknown} option - The option to normalize.
	 * @param {string} to - The default destination for the event.
	 * @param {string} message - The default message for the event.
	 * @returns {EmitterOption} - A new EmitterOption instance with resolved properties.
	 */
	private static getNormalizeOption (option: unknown, to: string, message: string) {
		let finalTo = to
		let finalMessage = message
		let finalData = option
		let finalDisableEmit = false

		if (option instanceof EmitterOption) {

			const { disableEmit, to: newTo, message: newMessage, data } = option

			if (disableEmit) {
				finalDisableEmit = disableEmit
			}

			if (newTo) {
				finalTo = newTo
			}

			if (newMessage) {
				finalMessage = newMessage
			}

			if (data) {
				finalData = data
			}
		}

		return new EmitterOption({
			to: finalTo,
			message: finalMessage,
			data: finalData,
			disableEmit: finalDisableEmit
		})
	}
}