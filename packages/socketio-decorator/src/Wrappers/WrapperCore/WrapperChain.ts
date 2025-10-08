import { IoCContainer } from "../../IoCContainer"
import { ControllerMetadata } from "../../MetadataRepository/MetadataObjects/Metadata"
import { Wrapper } from "./Wrapper"
import { ControllerInstance } from "../../Models/Utilities/ControllerTypes"

/**
 * Defines a chain of wrappers allowing to execute all the wrappers in the chain.
 */
export class WrapperChain {
	private wrappers: Wrapper[] = []

	/**
	 * Registers a wrapper in the chain.
	 * @param {Wrapper} wrapper - The wrapper to register.
	 * @returns {WrapperChain} This wrapper chain.
	 */
	public register (wrapper: Wrapper) {
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