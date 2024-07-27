import { ServerEmitter, ServerOn, SocketOn } from "@admandev/socketio-decorator";
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

	@SocketOn("disconnect")
	public onDisconnect(socket: Socket) {
		console.log("Socket disconnected - socket id :", socket.id)
	}

	@ServerEmitter("room", "my-emitter-event")
    emitMyEvent() {
        console.log("SecondSocketController: emitMyEvent");
        return {
			message: "Hello from emitMyEvent"
		};
    }
}