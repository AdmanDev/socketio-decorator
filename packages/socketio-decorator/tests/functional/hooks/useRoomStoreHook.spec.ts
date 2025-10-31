import { describe, expect, it } from "@jest/globals"
import { useRoomStore } from "../../../src"
import { RoomStore } from "../../../src/Features/SocketRoom/RoomStore"
import { RoomTest } from "../../types/roomTest"

describe("> UseRoomStore hook tests", () => {
	it("should get the room store instance", () => {
		const actualRoomStore = useRoomStore<RoomTest>()
		const expectedRoomStore = RoomStore.getInstance<RoomTest>()

		expect(actualRoomStore).toBeDefined()
		expect(actualRoomStore).toBe(expectedRoomStore)
	})
})
