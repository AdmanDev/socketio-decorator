import { Data, SocketNamespace, SocketOn } from "@admandev/socketio-decorator";
import { MessageRequest } from "../messageRequest";

@SocketNamespace("/my-namespace")
export class MyNamespaceController {
    @SocketOn("message")
    onMessage(@Data() data: MessageRequest) {
        console.log("Message in my-namespace", data.message)
    }
}