import { Operation } from "./Operation"

/**
 * Defines a chain of operations allowing to execute all the operationss in the chain.
 */
export class OperationChain {
	private operations: Operation[] = []

	/**
	 * Creates a new operation chain.
	 * @returns {OperationChain} A new operation chain.
	 */
	public static create () {
		return new OperationChain()
	}

	/**
	 * Registers an operation in the chain.
	 * @param {Operation} operation - The operation to register.
	 * @returns {OperationChain} This operation chain.
	 */
	public register (operation: Operation) {
		this.operations.push(operation)
		return this
	}

	/**
	 * Executes all operations in the chain.
	 */
	public execute () {
		this.operations.forEach(operation => operation.execute())
	}
}