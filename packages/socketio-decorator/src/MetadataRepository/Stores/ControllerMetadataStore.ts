import { ControllerMetadata } from "../MetadataObjects/Metadata"
import { MetadataUtils } from "../../Utils/MetadataUtils"
import { ControllerConstructor } from "../../Models/Utilities/ControllerTypes"

/**
 * Store for managing controller metadata
 */
export class ControllerMetadataStore {
	private static controllers: ControllerMetadata[] = []

	/**
	 * Gets the controller metadata for a given target
	 * @param {object} target The target object
	 * @returns {ControllerMetadata | undefined} The controller metadata for the target
	 */
	public static get (target: Object): ControllerMetadata | undefined {
		const targetClass = MetadataUtils.getTargetClass(target)
		return this.controllers.find((m) => m.controllerTarget === targetClass)
	}

	/**
	 * Gets or creates the controller metadata for a given target
	 * @param {object} target The target object
	 * @returns {ControllerMetadata} The controller metadata for the target
	 */
	public static getOrCreate (target: Object): ControllerMetadata {
		const existing = this.get(target)

		if (!existing) {
			const targetClass = MetadataUtils.getTargetClass(target)
			const controllerName = MetadataUtils.getTargetName(target)

			const newMetadata: ControllerMetadata = {
				controllerTarget: targetClass as ControllerConstructor,
				controllerName,
				namespace: "/",
				methodMetadata: [],
				middlewaresMetadata: []
			}

			this.controllers.push(newMetadata)

			return newMetadata
		}

		return existing
	}

	/**
	 * Updates the controller metadata for a given target
	 * @param {object} target The target object
	 * @param {Partial<ControllerMetadata>} metadata The metadata to update
	 */
	public static update (target: Object, metadata: Partial<ControllerMetadata>): void {
		const existing = this.getOrCreate(target)

		const targetClass = MetadataUtils.getTargetClass(target)
		const metadataIndex = this.controllers.findIndex((m) => m.controllerTarget === targetClass)

		if (metadataIndex !== -1) {
			this.controllers[metadataIndex] = {
				...existing,
				...metadata
			}
		}
	}

	/**
	 * Gets all the controller metadata
	 * @returns {ControllerMetadata[]} The global controller metadata
	 */
	public static getAll (): ControllerMetadata[] {
		return [...this.controllers]
	}
}
