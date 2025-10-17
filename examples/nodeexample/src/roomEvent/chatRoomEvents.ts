import { Socket } from "socket.io";
import { OnRoomJoined, OnRoomLeft, OnRoomCreated, OnRoomDeleted, SocketDataStore, useRoomStore } from "@admandev/socketio-decorator";
import { Room } from "../models/room";
import { SocketDataStoreSchema } from "../models/socketDataStoreSchema";

export class ChatRoomEvents {
    @OnRoomCreated("chat-*")
    public onChatRoomCreated(roomName: string) {
        console.log(`Room ${roomName} has been created`)

        const roomStore = useRoomStore<Room>()
        roomStore.addRoom(roomName, {
            name: roomName,
            members: [],
        })
    }

    @OnRoomJoined("chat-*")
    public onChatRoomJoined(roomName: string, socket: Socket) {
        console.log(`Socket ${socket.id} has joined room ${roomName}`)

        const roomStore = useRoomStore<Room>()
        const room = roomStore.getRoom(roomName)

        const socketDataStore = new SocketDataStore<SocketDataStoreSchema>(socket)
        const member = socketDataStore.getData("member")

        if (room && member) {
            room.members.push(member)
        }
    }

    @OnRoomLeft("chat-*")
    public onChatRoomLeft(roomName: string, socket: Socket) {
        console.log(`Socket ${socket.id} has left room ${roomName}`)

        const roomStore = useRoomStore<Room>()
        const room = roomStore.getRoom(roomName)

        if (room) {
            const socketDataStore = new SocketDataStore<SocketDataStoreSchema>(socket)
            const leftMember = socketDataStore.getData("member")

            room.members = room.members.filter(member => member !== leftMember)
        }
    }

    @OnRoomDeleted("chat-*")
    public onChatRoomDeleted(roomName: string) {
        console.log(`Room ${roomName} has been deleted`)

        const roomStore = useRoomStore<Room>()
        roomStore.removeRoom(roomName)
    }
}