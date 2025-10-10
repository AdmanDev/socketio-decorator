import { ConfigStore } from "../MetadataRepository/Stores/ConfigStore"
import { EventBinderStore } from "../MetadataRepository/Stores/EventBinderStore"
import { EventBinder } from "../Models/EventBinder"
import { Operation } from "../Wrappers/WrapperCore/Operation/Operation"

/**
 * Attaches consolidated event handlers to the Socket.IO server
 */
export class IoEventsBinder extends Operation {
	/** @inheritdoc */
	public execute () {
		const eventBindersGroupedByEvent = EventBinderStore.getAllGrouped()

		Object.entries(eventBindersGroupedByEvent).forEach(([eventName, binders]) => {
			this.bindEventToNamespaces(eventName, binders)
		})
	}

	/**
	 * Binds an event to all its namespaces
	 * @param {string} eventName The event name
	 * @param {EventBinder[]} binders The event binders for this event
	 */
	private bindEventToNamespaces (eventName: string, binders: EventBinder[]) {
		const bindersByNamespace = this.groupBindersByNamespace(binders)

		Object.entries(bindersByNamespace).forEach(([namespace, handlers]) => {
			this.attachEventHandler(eventName, namespace, handlers)
		})
	}

	/**
	 * Groups event binders by namespace
	 * @param {EventBinder[]} binders The event binders to group
	 * @returns {Record<string, Function[]>} The binders grouped by namespace
	 */
	private groupBindersByNamespace (binders: EventBinder[]) {
		return binders.reduce((grouped, binder) => {
			if (!grouped[binder.namespace]) {
				grouped[binder.namespace] = []
			}
			grouped[binder.namespace].push(binder.method)
			return grouped
		}, {} as Record<string, Function[]>)
	}

	/**
	 * Attaches a consolidated handler to a specific event on a namespace
	 * @param {string} eventName The event name
	 * @param {string} namespace The namespace
	 * @param {Function[]} handlers The handlers to execute
	 */
	private attachEventHandler (eventName: string, namespace: string, handlers: Function[]) {
		const namespaceInstance = ConfigStore.get().ioserver.of(namespace)

		namespaceInstance.on(eventName, (socket) => {
			handlers.forEach(handler => handler(socket))
		})
	}
}