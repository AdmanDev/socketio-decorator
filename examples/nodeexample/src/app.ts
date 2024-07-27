import { useSocketIoDecorator } from "@admandev/socketio-decorator"
import express from "express"
import http from "http"
import { Server, Socket } from "socket.io"
import { SocketController } from "./mySocketController"
import { MyServerMiddleware } from "./myServerMiddleware"
import { MySocketMiddleware } from "./MySocketMiddleware"
import { MySecondSocketController } from "./mySecondSocketController"

const app = express()
const server = http.createServer(app)

const port = 9000

server.on("listening", () => console.log(`Server started at http://localhost:${port}`))

const io = new Server(server)

useSocketIoDecorator({
	ioserver: io,
	controllers: [
		SocketController,
		MySecondSocketController
	],
	serverMiddlewares: [MyServerMiddleware],
	socketMiddlewares: [MySocketMiddleware],
	currentUserProvider: (socket: Socket) => {
		return {
			id: socket.id
		}
	}
})

// Start server
server.listen(port, server.address() as string)