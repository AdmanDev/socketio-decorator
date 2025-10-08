import { AppEventListener } from "../../Models/AppEventBus/AppEventBusModels"
import { ClassConstructorType } from "../../Models/ClassConstructorType"
import { ApplicationEventBus } from "../../Others/ApplicationEvent/ApplicationEventBus"

/**
 * Register a method as an app event listener
 * @param {string} eventName The name of the event to listen for
 * @returns {MethodDecorator} The decorator function
 */
export function AppOn (eventName: string) {
	return function <T extends AppEventListener>(
		target: Object,
		propertyKey: string | symbol,
		descriptor: TypedPropertyDescriptor<T>
	) {
		const appEventBus = ApplicationEventBus.getInstance()

		appEventBus.on({
			name: eventName,
			targetClass: target as ClassConstructorType<unknown>,
			callback: descriptor.value!
		})
	}
}
