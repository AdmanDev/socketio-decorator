import { Socket } from "socket.io"
import { EventBinder } from "../../Models/EventBinder"

/**
 * Store for managing event binders
 */
export class EventBinderStore {
	private static binders: EventBinder[] = []

	/**
	 * Adds a event binder to the global binder events array
	 * @param {string} namespace The namespace of the event
	 * @param {string} event The event name
	 * @param {Function} bindMethod The method to execute when the event is triggered
	 */
	public static add (namespace: string, event: string, bindMethod: (socket: Socket) => void): void {
		this.binders.push({
			eventName: event,
			namespace,
			method: bindMethod
		})
	}

	/**
	 * Gets the global event binders array
	 * @returns {Record<string, EventBinder[]>} The binder events grouped by event name
	 */
	public static getAllGrouped (): Record<string, EventBinder[]> {
		return this.binders.reduce((acc, event) => {
			if (!acc[event.eventName]) {
				acc[event.eventName] = []
			}
			acc[event.eventName].push(event)
			return acc
		}, {} as Record<string, EventBinder[]>)
	}
}
