import { Server, Socket } from "socket.io"
import { IoCProvider } from "./IocProvider"
import { ThrottleConfig } from "./ThrottleConfig"

export type SiodConfig = {
	/**
	 * The socket.io server instance
	 */
	ioserver: Server
	/**
	 * The IoC container provider (like TypeDI)
	 */
	iocContainer?: IoCProvider
	/**
	 * If true, the data validation will be enabled from listen events
	 */
	dataValidationEnabled?: boolean
	/**
	 * The controllers on which to bind the socket.io events.
	 * This can be an array of class references or an array of strings that match the file paths of the controllers.
	 */
	controllers: Function[] | string[]
	/**
	 * The socket.io server middlewares to use (io.use)
	 */
	serverMiddlewares?: Function[]
	/**
	 * The socket.io middlewares to use (socket.use)
	 */
	socketMiddlewares?: Function[]
	/**
	 * The error middleware that will be used to catch errors in your handlers.
	 */
	errorMiddleware?: Function
	/**
	 * The event throttling configuration.
	 */
	throttleConfig?: ThrottleConfig
	/**
	 * The current user provider that will be used to get the current user from CurrentUser decorator.
	 * @returns {Promise<TUser | null>} The current user if found, or null if not found
	 * @template TUser The user type
	 */
	currentUserProvider?: (socket: Socket) => Promise<Any>
	/**
	 * Search for a user socket that matches the search argument
	 * @param {any} arg The search argument
	 * @returns {Promise<Socket | null>} The socket that matches the search argument
	 */
	searchUserSocket?: (arg: Any) => Promise<Socket | null>
}