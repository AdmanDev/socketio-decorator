import { ISocketMiddleware } from "../../Interfaces/ISocketMiddleware"
import { MetadataDescription } from "./Metadata"

export type SocketMiddlewareMetadata = MetadataDescription & {
	middlewares: (new() => ISocketMiddleware)[]
}

export type ClassSocketMiddlewareMetadata = Omit<SocketMiddlewareMetadata, "methodName">