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
	 * The controllers on which to bind the socket.io events
	 */
	controllers: Function[]
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
	currentUserProvider?: (socket: Socket) => Any,
	/**
	 * Search for a user socket that matches the search argument
	 * @param {any} arg The search argument
	 * @returns {Socket | undefined} The socket that matches the search argument
	 */
	searchUserSocket?: (arg: Any) => Socket | undefined
}