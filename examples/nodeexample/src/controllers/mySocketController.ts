import { CurrentSocket, Data, ServerOn, SocketData, SocketDataStore, SocketEmitter, SocketOn } from "@admandev/socketio-decorator";
import { Socket } from "socket.io";
import { MessageRequest } from "../models/messageRequest";
import { SocketDataStoreSchema } from "../models/socketDataStoreSchema";

export class SocketController {
	@ServerOn("connection")
	public onConnection(@CurrentSocket() socket: Socket) {
		console.log("Socket connected with socket id", socket.id)
	}

	@SocketOn("message")
	public onMessage(@Data() data: MessageRequest) {
		console.log("Message", data.message)
	}

	@SocketOn("hello")
	@SocketEmitter("hello-back")
	public async onHello() {
		await new Promise((resolve) => setTimeout(resolve, 500))
		return {
			message: "Hello you"
		}
	}

	@SocketOn("set-language-preferences", { disableDataValidation: true })
	public setLanguagePreferences(@SocketData() dataStore: SocketDataStore<SocketDataStoreSchema>, @Data() language: string) {
		dataStore.setData("language", language)
		console.log("Language preferences set to", language)
	}

	@SocketOn("get-language-preferences")
	@SocketEmitter("user-pref")
	public getLanguagePreferences(@SocketData("language") language: string) {
		return {
			language
		}
	}

	@SocketOn("disconnect")
	public onDisconnect(@CurrentSocket() socket: Socket) {
		console.log("Socket disconnected - socket id :", socket.id)
	}

}