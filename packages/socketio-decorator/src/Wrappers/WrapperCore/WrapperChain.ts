import { IoCContainer } from "../../IoCContainer"
import { ClassConstructorType } from "../../Models/ClassConstructorType"
import { ControllerMetadata } from "../../Models/Metadata/Metadata"
import { Wrapper } from "./Wrapper"

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
			m.controllerInstance = IoCContainer.getInstance<ClassConstructorType<unknown>>(m.controllerTarget)
			this.wrappers.forEach(wrapper => wrapper.execute(m))
		})
	}
}