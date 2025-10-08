import { AppEventContext, AppOn } from "@admandev/socketio-decorator";

export class AppEventExemple {
    @AppOn("message")
    public onMessage(context: AppEventContext) {
        console.log(context)
    }
}