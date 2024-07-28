import { EmitterOption, ServerEmitter, ServerOn, SocketEmitter, SocketOn } from "@admandev/socketio-decorator";
import { Socket } from "socket.io";

export class SocketController {
    @ServerOn("connection")
    public onConnection(socket: Socket) {
      console.log("Socket connected with socket id", socket.id)
    }

	@SocketOn("message")
	public onMessage(socket: Socket, data: any) {
		console.log("Message", data)
		socket.join("room")
		this.emitMyEvent()
	}

	@SocketOn("hello")
	@SocketEmitter("hello-back")
	public async onHello() {
		await new Promise((resolve) => setTimeout(resolve, 2000))
		return {
			message: "Hello you"
		}
	}

	@SocketOn("disconnect")
	public onDisconnect(socket: Socket) {
		console.log("Socket disconnected - socket id :", socket.id)
	}

	@ServerEmitter()
    emitMyEvent() {
        console.log("SecondSocketController: emitMyEvent");
        const response = new EmitterOption({
			to: "room",
			message: "my-emitter-event",
			data: {
				message: "Hello from my-emitter-event"
			}
		})
		return response
    }
}