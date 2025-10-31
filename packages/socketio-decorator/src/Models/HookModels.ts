export type UseRoomReturnType<TRoom> = {
	room: TRoom | null
	getClients: () => string[]
	isEmpty: () => boolean
	hasClientInRoom: (socketId: string) => boolean
}