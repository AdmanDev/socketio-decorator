import { AppEventMetadataStore } from "../Stores/AppEventMetadataStore"

/**
 * Operations for managing app event metadata
 */
export class AppEventOperations {
	/**
	 * Adds app event metadata to the method
	 * @param {object} target The target object
	 * @param {string} methodName The method name
	 * @param {string} eventName The event name
	 */
	public static add (target: Object, methodName: string, eventName: string): void {
		AppEventMetadataStore.add(target, methodName, eventName)
	}
}