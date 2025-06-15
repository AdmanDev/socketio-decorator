import { Server, Socket } from "socket.io"
import { IoCProvider } from "./IocProvider"

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
	 * The current user provider that will be used to get the current user from useCurrentUser hook
	 */
	currentUserProvider?: (socket: Socket) => Any
	/**
	 * Search for a user socket that matches the search argument
	 * @param {any} arg The search argument
	 * @returns {Socket | undefined} The socket that matches the search argument
	 */
	searchUserSocket?: (arg: Any) => Socket | undefined
	/**
	 * Enables or disables parameter injection using decorators.
	 *
	 * When set to `true`, the legacy behavior is used:
	 * - The handler receives the raw arguments as-is, typically: `(socket, ...data)`
	 * - No parameter injection occurs — all arguments are mapped positionally.
	 * - Decorators like `@CurrentSocket()` or `@Data()` are ignored.
	 *
	 * When set to `false` (default), the library uses metadata from parameter decorators
	 * like `@CurrentSocket()` and `@Data()` to determine the arguments passed to handler methods.
	 * This allows for flexible argument positioning and explicit parameter semantics.
	 *
	 * ⚠️ **This legacy mode is deprecated** and will be removed in a future major release.
	 * It is strongly recommended to migrate to decorator-based parameter injection
	 * for better readability, maintainability, and future compatibility.
	 * @default false
	 * @deprecated Will be removed in a future major version.
	 */
	disableParamInjection?: boolean
}