import { useSocketIoDecorator } from "@admandev/socketio-decorator"
import express from "express"
import http from "http"
import { Server } from "socket.io"
import { SocketController } from "./socketController"
import { MyServerMiddleware } from "./MyServerMiddleware"
import { MySocketMiddleware } from "./MySocketMiddleware"
import { SecondSocketController } from "./secondSocketController"

const app = express()
const server = http.createServer(app)

const port = 9000

server.on("listening", () => console.log(`Server started at http://localhost:${port}`))

const io = new Server(server)

useSocketIoDecorator({
	ioserver: io,
	controllers: [
		SocketController,
		SecondSocketController
	],
	serverMiddlewares: [MyServerMiddleware],
	socketMiddlewares: [MySocketMiddleware]
})

// Start server
server.listen(port, server.address() as string)