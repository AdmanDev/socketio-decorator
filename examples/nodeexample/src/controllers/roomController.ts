import { CurrentSocket, Data, SocketData, SocketDataStore, SocketOn } from "@admandev/socketio-decorator";
import { Socket } from "socket.io";
import { SocketDataStoreSchema } from "../models/socketDataStoreSchema";
import { Member } from "../models/room";

export class RoomController {
    @SocketOn("create-room")
    public createRoom(@CurrentSocket() socket: Socket, @Data() data: string, @SocketData() socketData: SocketDataStore<SocketDataStoreSchema>) {
        const member: Member = {
            id: socket.id,
            name: `User_${socket.id.substring(0, 5)}`
        }

        socketData.setData("member", member)
        socket.join(data)
    }

    @SocketOn("leave-room")
    public leaveRoom(@CurrentSocket() socket: Socket, @Data() data: string) {
        socket.leave(data)
    }
}