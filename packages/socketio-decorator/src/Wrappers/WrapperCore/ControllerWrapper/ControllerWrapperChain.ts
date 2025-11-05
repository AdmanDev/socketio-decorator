import { IoCContainer } from "../../../IoCContainer"
import { ControllerMetadata } from "../../../MetadataRepository/MetadataObjects/Metadata"
import { ControllerWrapper } from "./ControllerWrapper"
import { ControllerInstance } from "../../../Models/Utilities/ControllerTypes"

/**
 * Defines a chain of wrappers allowing to execute all the controller wrappers in the chain.
 */
export class ControllerWrapperChain {
	private wrappers: ControllerWrapper[] = []

	/**
	 * Creates a new controller wrapper chain.
	 * @returns {ControllerWrapperChain} A new controller wrapper chain.
	 */
	public static create () {
		return new ControllerWrapperChain()
	}

	/**
	 * Registers a wrapper in the chain.
	 * @param {ControllerWrapper} wrapper - The wrapper to register.
	 * @returns {ControllerWrapperChain} This wrapper chain.
	 */
	public register (wrapper: ControllerWrapper) {
		this.wrappers.push(wrapper)
		return this
	}

	/**
	 * Executes all the wrappers in the chain.
	 * @param {ControllerMetadata[]} metadata - The metadata of the controllers to execute the wrappers on.
	 */
	public execute (metadata: ControllerMetadata[]) {
		metadata.forEach(m => {
			m.controllerInstance = IoCContainer.getInstance<ControllerInstance>(m.controllerTarget)
			this.wrappers.forEach(wrapper => wrapper.execute(m))
		})
	}
}