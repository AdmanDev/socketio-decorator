import { CurrentSocket, Data, ServerOn, SocketEmitter, SocketOn } from "@admandev/socketio-decorator";
import { Socket } from "socket.io";
import { MessageRequest } from "../messageRequest";

export class SocketController {
    @ServerOn("connection")
    public onConnection(@CurrentSocket() socket: Socket) {
      console.log("Socket connected with socket id", socket.id)
    }

	@SocketOn("message")
	public onMessage(@Data() data: MessageRequest) {
		console.log("Message", data.message)
	}

	@SocketOn("hello")
	@SocketEmitter("hello-back")
	public async onHello() {
		await new Promise((resolve) => setTimeout(resolve, 500))
		return {
			message: "Hello you"
		}
	}

	@SocketOn("disconnect")
	public onDisconnect(@CurrentSocket() socket: Socket) {
		console.log("Socket disconnected - socket id :", socket.id)
	}

}