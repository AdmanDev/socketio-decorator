import { AppEventListener } from "../../Models/AppEventBus/AppEventBusModels"
import { ClassConstructorType } from "../../Models/ClassConstructorType"
import { ApplicationEventBus } from "../../Wrappers/AppEvent/ApplicationEventBus"

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
			eventName: eventName,
			targetClass: target.constructor as ClassConstructorType<unknown>,
			methodName: descriptor.value!.name as keyof InstanceType<ClassConstructorType<unknown>>
		})
	}
}
