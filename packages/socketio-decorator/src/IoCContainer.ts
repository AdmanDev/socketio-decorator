import { ConfigStore } from "./MetadataRepository/Stores/ConfigStore"
import { ClassConstructorType } from "./Models/ClassConstructorType"

/**
 * Defines the IoC container manager
 */
export class IoCContainer {
	private static container = new Map<Function, Any>()

	/**
	 * Get all instances of the services
	 * @param {Function} services The services to get instances of
	 * @typedef T The instance type
	 * @returns {Array} The instances of the services
	 */
	public static getInstances<T> (services: Function[]) {
		return services.map((service) => {
			return IoCContainer.getInstance<T>(service)
		})
	}

	/**
	 * Get an instance of a service
	 * @param {Function} service The service to get an instance of
	 * @typedef T The instance type
	 * @returns {T} The instance of the service
	 */
	public static getInstance<T> (service: Function) {
		const userContainer = ConfigStore.get().iocContainer
		if (userContainer) {
			return userContainer.get(service as ClassConstructorType<typeof service>) as T
		}

		return IoCContainer.getServiceInstance(service as ClassConstructorType<typeof service>) as T
	}

	/**
	 * Get an instance of a service
	 * @param {ClassConstructorType<T>} constructor The service constructor
	 * @returns {T} The instance of the service
	 * @template T The type of the service
	 */
	private static getServiceInstance<T> (constructor: ClassConstructorType<T>): T {
		if (IoCContainer.container.has(constructor)) {
			return IoCContainer.container.get(constructor) as T
		}

		const instance = new constructor()
		IoCContainer.container.set(constructor, instance)

		return instance
	}
}