import { IoCContainer } from "../IoCContainer"
import { AppEventDescription } from "../MetadataRepository/MetadataObjects/AppEventMetadata"
import { AppEventMetadataStore } from "../MetadataRepository/Stores/AppEventMetadataStore"
import { ApplicationEventBus } from "../Others/ApplicationEvent/ApplicationEventBus"
import { OperationWrapper } from "./WrapperCore/OperationWrapper"

type WrapMethodContext = {
	events: AppEventDescription[]
	methodName: string
	targetInstance: Record<string, unknown>
	appEventBus: ApplicationEventBus
}

/**
 * Defines a wrapper to apply app emit decorators for standalone classes (non-controllers).
 */
export class AppEmitStandaloneWrapper extends OperationWrapper {
	/** @inheritdoc */
	public execute (): void {
		const metadata = AppEventMetadataStore.getAllStandalone()
		const appEventBus = ApplicationEventBus.getInstance()

		for (const appEventMetadata of metadata.values()) {
			const { methodName, target } = appEventMetadata
			const targetInstance = IoCContainer.getInstance<Record<string, unknown>>(target.constructor)

			this.wrapMethod({
				targetInstance: targetInstance,
				events: appEventMetadata.events,
				methodName: methodName,
				appEventBus
			})
		}
	}

	/**
	 * Wraps the method to add app event layer
	 * @param {WrapMethodContext} context - The context of the method to wrap
	 */
	private wrapMethod (context: WrapMethodContext) {
		const { targetInstance, methodName, events, appEventBus } = context

		const originalMethod = targetInstance[methodName] as Function

		const appEventProxy = async function (...args: unknown[]) {
			const result = await originalMethod.apply(targetInstance, args)

			Promise.all(events.map(eventDescription => {
				appEventBus.emit({
					eventName: eventDescription.eventName,
					data: result,
				})
			}))

			return result
		}

		targetInstance[methodName] = appEventProxy
	}
}