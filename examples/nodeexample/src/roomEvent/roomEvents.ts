import { Socket } from "socket.io";
import { OnRoomJoined, OnRoomLeft, OnRoomCreated, OnRoomDeleted } from "@admandev/socketio-decorator";

export class RoomEvents {
    @OnRoomCreated()
    public onRoomCreated(roomName: string) {
        console.log(`Room ${roomName} has been created`)
    }

    @OnRoomDeleted()
    public onRoomDeleted(roomName: string) {
        console.log(`Room ${roomName} has been deleted`)
    }

    @OnRoomJoined()
    public onRoomJoined(roomName: string, socket: Socket) {
        console.log(`Socket ${socket.id} joined room ${roomName}`)
    }

    @OnRoomLeft()
    public onRoomLeft(roomName: string, socket: Socket) {
        console.log(`Socket ${socket.id} left room ${roomName}`)
    }
}