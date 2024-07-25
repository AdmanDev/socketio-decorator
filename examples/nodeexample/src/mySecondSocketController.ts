import { ServerOn, SocketOn, SocketOnce } from "@admandev/socketio-decorator";
import { Socket } from "socket.io";

export class MySecondSocketController {
    @SocketOnce("my-event")
    onMyEvent(socket: Socket, data: any) {
        console.log("SecondSocketController: onMyEvent", data);
    }
}