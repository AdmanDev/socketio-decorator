import { ControllerWrapper } from "../WrapperCore/ControllerWrapper/ControllerWrapper"
import { ControllerMetadata } from "../../MetadataRepository/MetadataObjects/Metadata"
import { EventFuncProxyArgs } from "../../Models/EventFuncProxyType"
import { SiodInvalidMetadataError } from "../../Models/Errors/SiodInvalidMetadataError"
import { getReflectMethodMetadata } from "../../reflectMetadataFunc"
import { ControllerInstance } from "../../Models/Utilities/ControllerTypes"

/**
 * A wrapper to normalize the arguments of the controller methods
 */
export class ArgsNormalizer extends ControllerWrapper {
	/** @inheritdoc */
	public execute (metadata: ControllerMetadata): void {
		metadata.methodMetadata.forEach(methodMetadata => {
			this.normalize(metadata.controllerInstance!, methodMetadata.methodName)
		})
	}

	/**
	 * Normalizes the arguments of the method
	 * @param {ControllerInstance} controller The controller instance
	 * @param {string} methodName The name of the method
	 */
	private normalize (controller: ControllerInstance, methodName: string) {
		const originalHandler = controller[methodName] as Function

		const proxy = async function (...args: unknown[]) {
			let proxyArgs: EventFuncProxyArgs

			const firstArg = args.length > 0 ? args[0] : null

			if (firstArg && firstArg instanceof EventFuncProxyArgs) {
				proxyArgs = firstArg
			} else {
				proxyArgs = ArgsNormalizer.createProxyArgs(controller, methodName, args)
			}

			return await originalHandler.apply(controller, [proxyArgs])

		}

		controller[methodName] = proxy
	}

	/**
	 * Creates a proxy args
	 * @param {ControllerInstance} controller The controller instance
	 * @param {string} methodName The name of the method
	 * @param {unknown[]} args The arguments
	 * @returns {EventFuncProxyArgs} The proxy args
	 */
	private static createProxyArgs (controller: ControllerInstance, methodName: string, args: unknown[]) {
		const methodMetadata = getReflectMethodMetadata(controller.constructor.prototype, methodName)

		if (!methodMetadata) {
			throw new SiodInvalidMetadataError(`Method ${methodName} not found in ${controller.constructor.name}`)
		}

		return new EventFuncProxyArgs(args, methodMetadata, "", null)
	}
}