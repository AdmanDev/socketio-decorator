import { IErrorMiddleware } from "@admandev/socketio-decorator";
import { Socket } from "socket.io";

export class MyErrorMiddleware implements IErrorMiddleware{
    handleError (error: Error, socket?: Socket) {
        console.log('Error middleware: ', error);
    }
}