/**
 * Represents a generic controller instance
 */
export type ControllerInstance = Record<string, unknown>

/**
 * Represents a controller constructor that can be instantiated
 */
export type ControllerConstructor<T = ControllerInstance> = new (...args: unknown[]) => T

/**
 * Represents a generic middleware instance
 */
export type MiddlewareInstance = Record<string, unknown>

/**
 * Represents a middleware constructor that can be instantiated
 */
export type MiddlewareConstructor<T = MiddlewareInstance> = new (...args: unknown[]) => T