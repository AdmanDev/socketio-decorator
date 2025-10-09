import { IoCContainer } from "../../IoCContainer"
import { AppEventContext, AppEventListener } from "../../Models/AppEventBus/AppEventBusModels"
import { ClassConstructorType } from "../../Models/ClassConstructorType"

type ListenerMethodNames<T> = {
	[K in keyof T]: T[K] extends AppEventListener ? K : never
}[keyof T]

type ListenerRegistration<TTarget extends ClassConstructorType<unknown>> = {
	eventName: string;
	targetClass: TTarget;
	methodName: ListenerMethodNames<InstanceType<TTarget>>;
}

/**
 * Application-level event bus for handling custom events within the application
 * This is separate from Socket.IO network events and provides internal communication
 */
export class ApplicationEventBus {
	private static instance: ApplicationEventBus
	private listeners: Map<string, ListenerRegistration<Any>[]> = new Map()

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
	 * Registers a listener for a specific event
	 * @param {ListenerRegistration<TTarget>} listenerInfo The listener information
	 * @typedef TTarget The listener target class
	 */
	public on<TTarget extends ClassConstructorType<unknown>>(listenerInfo: ListenerRegistration<TTarget>): void {
		const { eventName } = listenerInfo

		const eventListeners = this.listeners.get(eventName) || []
		eventListeners.push(listenerInfo)

		this.listeners.set(eventName, eventListeners)
	}

	/**
	 * Emits an event to all registered listeners
	 * @param {AppEventContext} context The context of the event
	 */
	public emit (context: AppEventContext): void {
		const eventListeners = this.listeners.get(context.eventName)
		if (!eventListeners) {
			return
		}

		for (const { targetClass, methodName } of eventListeners) {
			const targetInstance = IoCContainer.getInstance<Record<string, AppEventListener>>(targetClass)
			setTimeout(() => targetInstance[methodName].apply(targetInstance, [context]), 0)
		}
	}

	/**
	 * Removes a specific listener for an event
	 * @param {ListenerRegistration<TTarget>} listenerRegistration The listener registration
	 * @typedef TTarget The listener target class
	 */
	public off<TTarget extends ClassConstructorType<unknown>>(listenerRegistration: ListenerRegistration<TTarget>): void {
		const { eventName, targetClass, methodName } = listenerRegistration

		const eventListeners = this.listeners.get(eventName)
		if (!eventListeners) {
			return
		}

		const newEventListeners = eventListeners.filter(
			listener => !(
				listener.eventName === eventName
				&& listener.targetClass === targetClass
				&& listener.methodName === methodName
			)
		)

		this.listeners.set(eventName, newEventListeners)
	}

	/**
	 * Removes all listeners for a specific event
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
	 * Removes all listeners
	 */
	public removeAllListeners (): void {
		this.listeners.clear()
	}
}
