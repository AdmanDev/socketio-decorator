import { Socket } from "socket.io";
import { OnRoomJoined, OnRoomLeft } from "@admandev/socketio-decorator";

export class RoomEvents {
    @OnRoomJoined()
    public onRoomJoined(roomName: string, socket: Socket) {
        console.log(`Socket ${socket.id} joined room ${roomName}`)
    }

    @OnRoomLeft()
    public onRoomLeft(roomName: string, socket: Socket) {
        console.log(`Socket ${socket.id} left room ${roomName}`)
    }
}