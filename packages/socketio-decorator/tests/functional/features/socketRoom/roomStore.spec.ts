import { describe, beforeEach, it, expect } from "@jest/globals"
import { RoomStore } from "../../../../src/Features/SocketRoom/RoomStore"
import { RoomTest } from "../../../types/roomTest"

describe("> RoomStore tests", () => {
	let roomStore: RoomStore<RoomTest>

	beforeEach(() => {
		roomStore = new RoomStore<RoomTest>()
	})

	describe("> Functional tests", () => {
		describe("#AddRoom", () => {
			it("should add a room to the store", () => {
				const roomId = "1"
				const expectedRoom: RoomTest = {
					id: roomId,
					messages: []
				}

				roomStore.addRoom(roomId, expectedRoom)

				const actualRoom = roomStore["rooms"].get(roomId)

				expect(actualRoom).toBe(expectedRoom)
			})

			it("should not add a room to the store if it already exists", () => {
				const roomId = "1"
				const room: RoomTest = {
					id: roomId,
					messages: []
				}

				roomStore.addRoom(roomId, room)
				roomStore.addRoom(roomId, room)

				const actualStoreSize = roomStore["rooms"].size

				expect(actualStoreSize).toBe(1)
			})

			it("should not replace an existing room", () => {
				const firstRoom: RoomTest = {
					id: "1",
					messages: ["Hello"]
				}

				const secondRoom: RoomTest = {
					id: "2",
					messages: ["World"]
				}

				roomStore.addRoom(firstRoom.id, firstRoom)
				roomStore.addRoom(firstRoom.id, secondRoom)

				const actualFirstRoom = roomStore["rooms"].get(firstRoom.id)

				expect(actualFirstRoom).toBe(firstRoom)
			})
		})

		describe("#GetRoom", () => {
			it("should return the room if it exists", () => {
				const roomId = "1"
				const expectedRoom: RoomTest = {
					id: roomId,
					messages: []
				}

				roomStore["rooms"].set(roomId, expectedRoom)

				const actualRoom = roomStore.getRoom(roomId)

				expect(actualRoom).toBe(expectedRoom)
			})

			it("should return null if the room does not exist", () => {
				const roomId = "1"

				const actualRoom = roomStore.getRoom(roomId)

				expect(actualRoom).toBeNull()
			})
		})

		describe("#RemoveRoom", () => {
			it("should remove a room from the store and return true", () => {
				const roomId = "1"
				const room: RoomTest = {
					id: roomId,
					messages: []
				}

				roomStore["rooms"].set(roomId, room)

				const wasRemoved = roomStore.removeRoom(roomId)
				const actualStoreSize = roomStore["rooms"].size

				expect(wasRemoved).toBe(true)
				expect(actualStoreSize).toBe(0)
			})

			it("should return false if the room does not exist", () => {
				const room: RoomTest = {
					id: "1",
					messages: []
				}

				roomStore["rooms"].set(room.id, room)

				const wasRemoved = roomStore.removeRoom("unknown room id")
				const actualStoreSize = roomStore["rooms"].size

				expect(wasRemoved).toBe(false)
				expect(actualStoreSize).toBe(1)
			})
		})

		describe("#ClearAllRooms", () => {
			it("should clear all rooms from the store", () => {
				const room1: RoomTest = {
					id: "1",
					messages: []
				}

				const room2: RoomTest = {
					id: "2",
					messages: []
				}

				roomStore["rooms"].set(room1.id, room1)
				roomStore["rooms"].set(room2.id, room2)

				roomStore.clearAllRooms()

				const actualStoreSize = roomStore["rooms"].size

				expect(actualStoreSize).toBe(0)
			})
		})
	})
})