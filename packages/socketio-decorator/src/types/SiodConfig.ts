import { Server, Socket } from "socket.io"
import { IoCProvider } from "./iocProvider"

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
	 * The current user provider that will be used to get the current user from useCurrentUser hook
	 */
	currentUserProvider?: (socket: Socket) => Any,
	searchUserSocket?: (arg: Any) => Socket | undefined
}