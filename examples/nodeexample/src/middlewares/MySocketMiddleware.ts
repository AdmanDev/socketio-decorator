import { ISocketMiddleware } from "@admandev/socketio-decorator"
import { Event, Socket } from "socket.io"

export class MySocketMiddleware implements ISocketMiddleware {
  use(socket: Socket, [event, ...args]: Event, next: (err?: Error) => void): void {
    console.log(`MySocketMiddleware triggered from ${event} event`)
    next()
  }
}