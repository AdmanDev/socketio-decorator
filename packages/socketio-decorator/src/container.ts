import { ClassConstructorType } from "./types/classConstructorType"
import { IoCProvider } from "./types/iocProvider"

const container = new Map<Function, Any>()

/**
 * Get all instances of the services
 * @param {Function} services The services to get instances of
 * @param {IoCProvider} userContainer The user IoC container
 * @typedef T The instance type
 * @returns {Array} The instances of the services
 */
export function getInstances<T> (services: Function[], userContainer?: IoCProvider) {
	return services.map((service) => {
		return getInstance<T>(service, userContainer)
	})
}

/**
 * Get an instance of a service
 * @param {Function} service The service to get an instance of
 * @param {IoCProvider} userContainer The user IoC container
 * @typedef T The instance type
 * @returns {T} The instance of the service
 */
export function getInstance<T> (service: Function, userContainer?: IoCProvider) {
	if (userContainer) {
		return userContainer.get(service as ClassConstructorType<typeof service>) as T
	}
	return getserviceInstance(service as ClassConstructorType<typeof service>) as T
}

/**
 * Get an instance of a service
 * @param {ClassConstructorType<T>} constructor The service constructor
 * @returns {T} The instance of the service
 * @template T The type of the service
 */
function getserviceInstance<T> (constructor: ClassConstructorType<T>): T {
	if (container.has(constructor)) {
		return container.get(constructor) as T
	}

	const instance = new constructor()
	container.set(constructor, instance)

	return instance
}