import { ClassConstructorType } from "./Models/ClassConstructorType"
import { IoCProvider } from "./Models/IocProvider"

/**
 * Defines the IoC container manager
 */
export class IoCContainer {
	private static container = new Map<Function, Any>()

	/**
	 * Get all instances of the services
	 * @param {Function} services The services to get instances of
	 * @param {IoCProvider} userContainer The user IoC container
	 * @typedef T The instance type
	 * @returns {Array} The instances of the services
	 */
	public static getInstances<T> (services: Function[], userContainer?: IoCProvider) {
		return services.map((service) => {
			return IoCContainer.getInstance<T>(service, userContainer)
		})
	}

	/**
	 * Get an instance of a service
	 * @param {Function} service The service to get an instance of
	 * @param {IoCProvider} userContainer The user IoC container
	 * @typedef T The instance type
	 * @returns {T} The instance of the service
	 */
	public static getInstance<T> (service: Function, userContainer?: IoCProvider) {
		if (userContainer) {
			return userContainer.get(service as ClassConstructorType<typeof service>) as T
		}
		return IoCContainer.getserviceInstance(service as ClassConstructorType<typeof service>) as T
	}

	/**
	 * Get an instance of a service
	 * @param {ClassConstructorType<T>} constructor The service constructor
	 * @returns {T} The instance of the service
	 * @template T The type of the service
	 */
	public static getserviceInstance<T> (constructor: ClassConstructorType<T>): T {
		if (IoCContainer.container.has(constructor)) {
			return IoCContainer.container.get(constructor) as T
		}

		const instance = new constructor()
		IoCContainer.container.set(constructor, instance)

		return instance
	}
}