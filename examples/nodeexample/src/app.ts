import http from "http"
import express, { Express } from "express"
import { useSocketDecorator } from '@admandev/socketio-decorator';
import { Server } from 'socket.io';
import { SocketController } from './socketController';
import { MyServerMiddleware } from "./MyServerMiddleware";

/**
 * Defines App express setup
 */
export class App {
	static server?: http.Server
	static port: number

	/**
	 * Initializes the express server
	 */
	static init () {
		if (App.server) {
			return
		}

		//Create server
		const app = App.createExpressApp()
		App.server = http.createServer(app)

		App.server.on("listening", () => console.log(`Server started at http://localhost:${App.port}`))

		App.port = 9000

		const io = new Server(App.server)

		useSocketDecorator({
			ioserver: io,
			controllers: [
				SocketController
			],
			serverMiddlewares: [
				MyServerMiddleware
			]
		})

		// Start server
		App.server.listen(App.port, App.server.address() as string)
	}

	/**
	 * Create and configure the Express app
	 * @returns {Express} The Express application
	 */
	private static createExpressApp () {
		// Configure Express Application
		const app = express()

		app.set("trust proxy", 1)

		app.use((req, res, next) => {
			res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content, Accept, Content-Type, Authorization")
			res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS")
			res.setHeader("Access-Control-Allow-Credentials", "true")
			next()
		})

		app.use(express.urlencoded({ extended: true }))
		app.use(express.json())

		return app
	}
}

App.init()