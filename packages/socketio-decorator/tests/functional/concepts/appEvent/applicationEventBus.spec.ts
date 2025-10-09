import { beforeAll, beforeEach, describe, expect, it, jest } from "@jest/globals"
import { AppEventContext } from "../../../../src/Models/AppEventBus/AppEventBusModels"
import { ApplicationEventBus } from "../../../../src/Wrappers/AppEvent/ApplicationEventBus"
import { ConfigStore } from "../../../../src/MetadataRepository/Stores/ConfigStore"
import { waitFor } from "../../../utilities/testUtils"

describe("> ApplicationEventBus tests", () => {
	let appEventBus: ApplicationEventBus

	const notifyWarehouseSpy = jest.fn()
	const notifyCustomerSpy = jest.fn()
	const updateInventorySpy = jest.fn()
	const otherEventSpy = jest.fn()

	class OrderNotificationService {
		public notifyWarehouse (context: AppEventContext) {
			notifyWarehouseSpy(context)
		}

		public notifyCustomer (context: AppEventContext) {
			notifyCustomerSpy(context)
		}
	}

	class InventoryService {
		public updateInventory (context: AppEventContext) {
			updateInventorySpy(context)
		}

		public otherEvent (context: AppEventContext) {
			otherEventSpy(context)
		}
	}

	beforeAll(() => {
		ConfigStore.set({} as unknown as Any)
	})

	beforeEach(() => {
		appEventBus = new ApplicationEventBus()
	})

	describe("> Functional tests", () => {
		it("should trigger a listener for an event", async () => {
			const eventName = "new-order"
			const data = "test"

			const expectedContext: AppEventContext = {
				eventName,
				data,
				ioContext: undefined
			}

			appEventBus.on({
				eventName,
				targetClass: OrderNotificationService,
				methodName: "notifyWarehouse"
			})

			appEventBus.emit(expectedContext)

			await waitFor(50)

			expect(notifyWarehouseSpy).toHaveBeenNthCalledWith(1, expectedContext)
		})

		it("should trigger multiple listeners (same class)", async () => {
			const eventName = "new-order"
			const data = "test"

			const expectedContext: AppEventContext = {
				eventName,
				data,
				ioContext: undefined
			}

			appEventBus.on({
				eventName,
				targetClass: OrderNotificationService,
				methodName: "notifyWarehouse"
			})

			appEventBus.on({
				eventName,
				targetClass: OrderNotificationService,
				methodName: "notifyCustomer"
			})

			appEventBus.emit(expectedContext)

			await waitFor(50)

			expect(notifyWarehouseSpy).toHaveBeenNthCalledWith(1, expectedContext)
			expect(notifyCustomerSpy).toHaveBeenNthCalledWith(1, expectedContext)
		})

		it("should trigger all listeners (multiple classes)", async () => {
			const eventName = "new-order"
			const data = "test"

			const expectedContext: AppEventContext = {
				eventName,
				data,
				ioContext: undefined
			}

			appEventBus.on({
				eventName,
				targetClass: OrderNotificationService,
				methodName: "notifyWarehouse"
			})

			appEventBus.on({
				eventName,
				targetClass: OrderNotificationService,
				methodName: "notifyCustomer"
			})

			appEventBus.on({
				eventName,
				targetClass: InventoryService,
				methodName: "updateInventory"
			})

			appEventBus.emit(expectedContext)

			await waitFor(50)

			expect(notifyWarehouseSpy).toHaveBeenNthCalledWith(1, expectedContext)
			expect(notifyCustomerSpy).toHaveBeenNthCalledWith(1, expectedContext)
			expect(updateInventorySpy).toHaveBeenNthCalledWith(1, expectedContext)
		})

		it("should only trigger listeners matching the emitted event name", async () => {
			const eventName = "new-order"
			const otherEventName = "other-event"

			appEventBus.on({
				eventName,
				targetClass: OrderNotificationService,
				methodName: "notifyWarehouse"
			})

			appEventBus.on({
				eventName,
				targetClass: OrderNotificationService,
				methodName: "notifyCustomer"
			})

			appEventBus.on({
				eventName: otherEventName,
				targetClass: InventoryService,
				methodName: "otherEvent"
			})

			appEventBus.emit({
				eventName,
				data: "test"
			})

			await waitFor(50)

			expect(notifyWarehouseSpy).toHaveBeenCalledTimes(1)
			expect(notifyCustomerSpy).toHaveBeenCalledTimes(1)
			expect(otherEventSpy).not.toHaveBeenCalled()
		})

		it("should remove a specific listener for an event", async () => {
			const eventName = "new-order"
			const data = "test"

			const context: AppEventContext = {
				eventName,
				data,
			}

			const notifyWarehouseRegistration = {
				eventName,
				targetClass: OrderNotificationService,
				methodName: "notifyWarehouse" as const
			}

			const notifyCustomerRegistration = {
				eventName,
				targetClass: OrderNotificationService,
				methodName: "notifyCustomer" as const
			}

			appEventBus.on(notifyCustomerRegistration)
			appEventBus.on(notifyWarehouseRegistration)

			appEventBus.off(notifyWarehouseRegistration)

			appEventBus.emit(context)

			await waitFor(50)

			expect(notifyWarehouseSpy).not.toHaveBeenCalled()
			expect(notifyCustomerSpy).toHaveBeenCalled()
		})

		it("should remove all listeners for an event", async () => {
			const eventName = "new-order"
			const anotherEventName = "another-event"
			const data = "test"

			const newOrdercontext: AppEventContext = {
				eventName,
				data,
			}

			const anotherEventcontext: AppEventContext = {
				eventName: anotherEventName,
				data,
			}

			appEventBus.on({
				eventName,
				targetClass: OrderNotificationService,
				methodName: "notifyWarehouse"
			})

			appEventBus.on({
				eventName,
				targetClass: OrderNotificationService,
				methodName: "notifyCustomer"
			})

			appEventBus.on({
				eventName,
				targetClass: InventoryService,
				methodName: "updateInventory"
			})

			appEventBus.on({
				eventName: anotherEventName,
				targetClass: InventoryService,
				methodName: "otherEvent"
			})

			appEventBus.offAll(eventName)

			appEventBus.emit(newOrdercontext)
			appEventBus.emit(anotherEventcontext)

			await waitFor(50)

			expect(notifyWarehouseSpy).not.toHaveBeenCalled()
			expect(notifyCustomerSpy).not.toHaveBeenCalled()
			expect(updateInventorySpy).not.toHaveBeenCalled()
			expect(otherEventSpy).toHaveBeenCalled()
		})

		it("should clear all listeners", async () => {
			const eventName = "new-order"
			const anotherEventName = "another-event"
			const data = "test"

			const newOrderContext: AppEventContext = {
				eventName,
				data,
			}

			const otherEventContext: AppEventContext = {
				eventName: anotherEventName,
				data,
			}

			appEventBus.on({
				eventName,
				targetClass: OrderNotificationService,
				methodName: "notifyWarehouse"
			})

			appEventBus.on({
				eventName,
				targetClass: OrderNotificationService,
				methodName: "notifyCustomer"
			})

			appEventBus.on({
				eventName,
				targetClass: InventoryService,
				methodName: "updateInventory"
			})

			appEventBus.on({
				eventName: anotherEventName,
				targetClass: InventoryService,
				methodName: "otherEvent"
			})

			appEventBus.removeAllListeners()

			appEventBus.emit(newOrderContext)
			appEventBus.emit(otherEventContext)

			await waitFor(50)

			expect(notifyWarehouseSpy).not.toHaveBeenCalled()
			expect(notifyCustomerSpy).not.toHaveBeenCalled()
			expect(updateInventorySpy).not.toHaveBeenCalled()
			expect(otherEventSpy).not.toHaveBeenCalled()
		})

	})
})