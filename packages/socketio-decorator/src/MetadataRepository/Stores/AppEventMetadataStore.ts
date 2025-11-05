import { ControllerConstructor } from "../../Models/Utilities/ControllerTypes"
import { AppEventMetadata } from "../MetadataObjects/AppEventMetadata"
import { ControllerMetadataStore } from "./ControllerMetadataStore"

/**
 * Store for managing app event metadata
 */
export class AppEventMetadataStore {
	private static appEventMetadata: Map<string, AppEventMetadata> = new Map()

	/**
	 * Adds app event metadata to the store
	 * @param {object} target The target object
	 * @param {string} methodName The method name
	 * @param {string} eventName The event name
	 */
	public static add (target: Object, methodName: string, eventName: string): void {
		const methodIdentifier = this.getMethodIdentifier(target, methodName)
		let appEventMetadata = this.appEventMetadata.get(methodIdentifier)

		if (!appEventMetadata) {
			appEventMetadata = {
				target,
				methodName,
				events: []
			}
			this.appEventMetadata.set(methodIdentifier, appEventMetadata)
		}

		appEventMetadata.events.push({ eventName })

	}

	/**
	 * Gets all the app event metadata for controllers
	 * @returns {Map<string, AppEventMetadata>} The controller app event metadata
	 */
	public static getAllControllers (): Map<string, AppEventMetadata> {
		return this.filterByControllerTargets(isController => isController)
	}

	/**
	 * Gets all the app event metadata for standalone classes (non-controllers)
	 * @returns {Map<string, AppEventMetadata>} The standalone app event metadata
	 */
	public static getAllStandalone (): Map<string, AppEventMetadata> {
		return this.filterByControllerTargets(isController => !isController)
	}

	/**
	 * Helper to get controller targets as a Set
	 * @returns {Set<ControllerConstructor>} The controller targets
	 */
	private static getControllerTargets (): Set<ControllerConstructor> {
		const controllerMetadata = ControllerMetadataStore.getAll()
		return new Set(controllerMetadata.map(c => c.controllerTarget))
	}

	/**
	 * Helper to filter appEventMetadata by a predicate on controllerTargets
	 * @param {(isController: boolean) => boolean} predicate - The predicate function
	 * @returns {Map<string, AppEventMetadata>} The filtered app event metadata
	 */
	private static filterByControllerTargets (
		predicate: (isController: boolean) => boolean
	): Map<string, AppEventMetadata> {
		const controllerTargets = this.getControllerTargets()
		const filtered = new Map<string, AppEventMetadata>()

		for (const [key, metadata] of this.appEventMetadata) {
			const isController = controllerTargets.has(metadata.target.constructor as ControllerConstructor)

			if (predicate(isController)) {
				filtered.set(key, metadata)
			}
		}

		return filtered
	}

	/**
	 * Gets the method identifier
	 * @param {object} target The target object
	 * @param {string} methodName The method name
	 * @returns {string} The method identifier
	 */
	private static getMethodIdentifier (target: Object, methodName: string): string {
		return `${target.constructor.name}.${methodName}`
	}
}