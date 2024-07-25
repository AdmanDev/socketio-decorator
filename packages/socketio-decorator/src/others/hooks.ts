import { Server } from "socket.io"
import { ioServer } from "../globalMetadata"

/**
 * Get the socket.io server instance
 * @returns {Server} The socket.io server instance
 */
export function useIoServer (): Server {
	return ioServer
}