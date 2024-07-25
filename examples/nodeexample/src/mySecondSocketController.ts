import { SocketOnAny, SocketOnAnyOutgoing, SocketOnce } from "@admandev/socketio-decorator";
import { Socket } from "socket.io";

export class MySecondSocketController {
    @SocketOnce("my-once-event")
    onMyOnceEvent(socket: Socket, data: any) {
        console.log("SecondSocketController: onMyOnceEvent", data);
        socket.emit("my-once-event", "Hello from onAnyEvent");
    }

    @SocketOnAny()
    onAnyEvent(socket: Socket, event: string, data: any) {
        console.log(`SecondSocketController: onAnyEvent (${event})`, data);
    }

    @SocketOnAnyOutgoing()
    onAnyOutgoingEvent(socket: Socket, event: string, data: any) {
        console.log(`SecondSocketController: onAnyOutgoingEvent (${event})`, data);
    }
}