import { Socket } from "socket.io";
import { OnRoomJoined } from "@admandev/socketio-decorator";

export class RoomEvents {
    @OnRoomJoined()
    public onRoomJoined(roomName: string, socket: Socket) {
        console.log(`Socket ${socket.id} joined room ${roomName}`)
    }
}