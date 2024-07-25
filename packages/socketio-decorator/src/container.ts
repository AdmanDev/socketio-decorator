import { ClassConstructorType } from "./types/classConstructorType"
import { IoCProvider } from "./types/iocProvider"

/**
 * Get all instances of the services
 * @param {Function} services The services to get instances of
 * @param {IoCProvider} userContainer The user IoC container
 * @typedef T The instance type
 * @returns {Array} The instances of the services
 */
export function getInstances<T> (services: Function[], userContainer?: IoCProvider) {
	return services.map((service) => {
		if (userContainer) {
			return userContainer.get(service as ClassConstructorType<typeof service>) as T
		}
		return getserviceInstance(service as ClassConstructorType<typeof service>) as T
	})
}

/**
 * Get an instance of a service
 * @param {ClassConstructorType<T>} constructor The service constructor
 * @returns {T} The instance of the service
 * @template T The type of the service
 */
function getserviceInstance<T> (constructor: ClassConstructorType<T>): T {
	const instance = new constructor()
	return instance
}