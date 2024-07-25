import { SocketOnAny, SocketOnce } from "@admandev/socketio-decorator";
import { Socket } from "socket.io";

export class MySecondSocketController {
    @SocketOnce("my-once-event")
    onMyOnceEvent(socket: Socket, data: any) {
        console.log("SecondSocketController: onMyOnceEvent", data);
    }

    @SocketOnAny()
    onAnyEvent(socket: Socket, event: string, data: any) {
        console.log(`SecondSocketController: onAnyEvent (${event})`, data);
    }
}