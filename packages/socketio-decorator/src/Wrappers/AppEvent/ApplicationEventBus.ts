import { AppEventContext, AppEventListener } from "../../Models/AppEventBus/AppEventBusModels"
import { ClassConstructorType } from "../../Models/ClassConstructorType"

type AppEventBListenerMetadata = {
	name: string
	targetClass: ClassConstructorType<unknown>
	callback: AppEventListener
}

/**
 * Application-level event bus for handling custom events within the application
 * This is separate from Socket.IO network events and provides internal communication
 */
export class ApplicationEventBus {
	private static instance: ApplicationEventBus
	private listeners: Map<string, AppEventBListenerMetadata[]> = new Map()

	/**
	 * Get the instance of the application event bus
	 * @returns {ApplicationEventBus} The instance of the application event bus
	 */
	public static getInstance (): ApplicationEventBus {
		if (!this.instance) {
			this.instance = new ApplicationEventBus()
		}
		return this.instance
	}

	/**
	 * Emit an event to all registered listeners
	 * @param {AppEventContext} context The context of the event
	 */
	public emit (context: AppEventContext): void {
		const eventListeners = this.listeners.get(context.eventName)
		if (!eventListeners) {
			return
		}

		for (const { targetClass, callback } of eventListeners) {
			setTimeout(() => callback.apply(targetClass, [context]), 0)
		}
	}

	/**
	 * Register a listener for a specific event
	 * @param {AppEventBListenerMetadata} listenerInfo The listener information
	 */
	public on (listenerInfo: AppEventBListenerMetadata): void {
		const { name } = listenerInfo
		if (!name) {
			return
		}

		const eventListeners = this.listeners.get(name) || []
		eventListeners.push(listenerInfo)

		this.listeners.set(name, eventListeners)
	}

	/**
	 * Remove a specific listener for an event
	 * @param {string} eventName The name of the event
	 * @param {Function} callback The specific callback to remove
	 */
	public off (eventName: string, callback: AppEventListener): void {
		const eventListeners = this.listeners.get(eventName)
		if (!eventListeners) {
			return
		}

		const newEventListeners = eventListeners.filter(
			listener => !(listener.name === eventName && listener.callback === callback)
		)

		this.listeners.set(eventName, newEventListeners)
	}

	/**
	 * Remove all listeners for a specific event
	 * @param {string} eventName The name of the event
	 */
	public offAll (eventName: string): void {
		const eventListeners = this.listeners.get(eventName)

		if (!eventListeners) {
			return
		}

		this.listeners.delete(eventName)
	}

	/**
	 * Remove all listeners
	 */
	public removeAllListeners (): void {
		this.listeners.clear()
	}
}
