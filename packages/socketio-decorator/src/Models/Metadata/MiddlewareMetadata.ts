import { ISocketMiddleware } from "../../Interfaces/ISocketMiddleware"
import { Metadata } from "./Metadata"

export type SocketMiddlewareMetadata = Metadata & {
	middlewares: (new() => ISocketMiddleware)[]
}

export type ClassSocketMiddlewareMetadata = Omit<SocketMiddlewareMetadata, "methodName">