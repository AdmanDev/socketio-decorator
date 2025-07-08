import "reflect-metadata"
import { useSocketIoDecorator } from "@admandev/socketio-decorator"
import express from "express"
import http from "http"
import { Server, Socket } from "socket.io"
import { MyServerMiddleware } from "./middlewares/MyServerMiddleware"
import { MySocketMiddleware } from "./middlewares/MySocketMiddleware"
import { MyErrorMiddleware } from "./middlewares/myErrorMiddleware"
import path from "path"

const app = express()
const server = http.createServer(app)

const port = 9000

server.on("listening", () => console.log(`Server started at http://localhost:${port}`))

const io = new Server(server)

useSocketIoDecorator({
	ioserver: io,
	dataValidationEnabled: true,
	controllers: [path.join(__dirname, "/controllers/*.js")],
	serverMiddlewares: [MyServerMiddleware],
	socketMiddlewares: [MySocketMiddleware],
	errorMiddleware: MyErrorMiddleware,
	currentUserProvider: (socket: Socket) => {
		return {
			id: socket.id
		}
	},
	searchUserSocket: async (id: string) => {
		return Promise.resolve(io.sockets.sockets.get(id) || null)
	}
})

// Start server
server.listen(port, server.address() as string)