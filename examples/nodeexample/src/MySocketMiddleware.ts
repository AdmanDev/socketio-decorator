import { ISocketMiddleware } from "@admandev/socketio-decorator"
import { Event } from "socket.io"

export class MySocketMiddleware implements ISocketMiddleware {
  use([event, ...args]: Event, next: (err?: Error) => void): void {
    console.log(`MySocketMiddleware triggered from ${event} event`)
    next()
  }
}