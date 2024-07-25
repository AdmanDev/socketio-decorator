import { ServerOn, SocketOn, SocketOnce } from "@admandev/socketio-decorator";
import { Socket } from "socket.io";

export class SecondSocketController {
    @SocketOnce("my-event")
    onMyEvent(socket: Socket, data: any) {
        console.log("SecondSocketController: onMyEvent", data);
    }

    @SocketOnce("my-event")
    onMyEvent2(socket: Socket, data: any) {
        console.log("SecondSocketController: onMyEvent2", data);
    }
}