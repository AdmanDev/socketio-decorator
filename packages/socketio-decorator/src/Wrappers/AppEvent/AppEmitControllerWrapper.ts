import { AppEventDescription } from "../../MetadataRepository/MetadataObjects/AppEventMetadata"
import { AppEventMetadataStore } from "../../MetadataRepository/Stores/AppEventMetadataStore"
import { AppEventContext } from "../../Models/AppEventBus/AppEventBusModels"
import { EventFuncProxyArgs } from "../../Models/EventFuncProxyType"
import { ApplicationEventBus } from "./ApplicationEventBus"
import { ControllerWrapper } from "../WrapperCore/ControllerWrapper/ControllerWrapper"
import { ControllerMetadata } from "../../MetadataRepository/MetadataObjects/Metadata"

type WrapMethodContext = {
	events: AppEventDescription[]
	methodName: string
	targetInstance: Record<string, unknown>
	appEventBus: ApplicationEventBus
}

/**
 * Defines a wrapper to apply app emit decorators for controllers.
 * This wrapper has access to EventFuncProxyArgs and can extract ioContext.
 */
export class AppEmitControllerWrapper extends ControllerWrapper {
	/** @inheritdoc */
	public execute (metadata: ControllerMetadata): void {
		const appEventMetadata = AppEventMetadataStore.getAllControllers()
		const appEventBus = ApplicationEventBus.getInstance()

		for (const appEventMetadataItem of appEventMetadata.values()) {
			if (appEventMetadataItem.target.constructor === metadata.controllerTarget) {
				const { methodName } = appEventMetadataItem
				const targetInstance = metadata.controllerInstance!

				this.wrapMethod({
					targetInstance: targetInstance,
					events: appEventMetadataItem.events,
					methodName: methodName,
					appEventBus
				})
			}
		}
	}

	/**
	 * Wraps the method to add app event layer with ioContext
	 * @param {WrapMethodContext} context - The context of the method to wrap
	 */
	private wrapMethod (context: WrapMethodContext) {
		const { targetInstance, methodName, events, appEventBus } = context

		const originalMethod = targetInstance[methodName] as Function

		const appEventProxy = async function (...args: unknown[]) {
			const result = await originalMethod.apply(targetInstance, args)

			let ioContext: AppEventContext["ioContext"]

			const firstArg = args[0]
			if (firstArg instanceof EventFuncProxyArgs) {
				ioContext = {
					currentSocket: firstArg.socket,
					eventName: firstArg.eventName,
					eventData: firstArg.data
				}
			}

			Promise.all(events.map(eventDescription => {
				appEventBus.emit({
					eventName: eventDescription.eventName,
					data: result,
					ioContext: ioContext
				})
			}))

			return result
		}

		targetInstance[methodName] = appEventProxy
	}
}
