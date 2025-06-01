import { ISocketMiddleware } from "../../Interfaces/ISocketMiddleware"
import { Metadata } from "./Metadata"

export type SocketMiddlewareMetadata = Metadata & {
	middlewares: (new() => ISocketMiddleware)[]
}