import { CurrentSocket, EmitterOption, ServerEmitter, SocketOn, SocketOnAny, SocketOnAnyOutgoing, SocketOnce, useIoServer } from "@admandev/socketio-decorator";
import { Socket } from "socket.io";

export class MySecondSocketController {
    @SocketOnce("my-once-event")
    onMyOnceEvent(data: any) {
        console.log("SecondSocketController: onMyOnceEvent", data);

        const io = useIoServer();
        io.emit("my-once-event-response", "Hello from onAnyEvent");
    }

    @SocketOnAny()
    onAnyEvent(event: string, data: any) {
        console.log(`SecondSocketController: onAnyEvent (${event})`, data);
    }

    @SocketOnAnyOutgoing()
    onAnyOutgoingEvent(event: string, data: any) {
        console.log(`SecondSocketController: onAnyOutgoingEvent (${event})`, data);
    }

    @SocketOn("multiple-events")
    @ServerEmitter()
    onMultipleEvents(@CurrentSocket() socket: Socket) {
        socket.join("multiple-events");
        const events: EmitterOption[] = [
            new EmitterOption({
                to: socket.id,
                message: "event-1",
                data: {
                    message: "This is event 1"
                }
            }),
            new EmitterOption({
                to: "multiple-events",
                message: "event-2",
                data: {
                    message: "This is events-2"
                }
            }),
        ]

        return events
    }
}