import { Server } from "socket.io"
import { IoCProvider } from "./iocProvider"

export type SiodConfig = {
	ioserver: Server
	iocContainer?: IoCProvider
	controllers: Function[]
	serverMiddlewares?: Function[]
}