import { IServerMiddleware } from "@admandev/socketio-decorator"
import { Socket } from "socket.io"

export class MyServerMiddleware implements IServerMiddleware {
    private message = "MyServerMiddleware triggered by socket id: "
    
    use(socket: Socket, next: (err?: unknown) => void) {
        console.log(this.message, socket.id)
        next()
    }
}