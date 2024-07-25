import { SocketOnAny, SocketOnAnyOutgoing, SocketOnce, useIoServer } from "@admandev/socketio-decorator";
import { Socket } from "socket.io";

export class MySecondSocketController {
    @SocketOnce("my-once-event")
    onMyOnceEvent(socket: Socket, data: any) {
        console.log("SecondSocketController: onMyOnceEvent", data);

        const io = useIoServer();
        io.emit("my-once-event-response", "Hello from onAnyEvent");
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