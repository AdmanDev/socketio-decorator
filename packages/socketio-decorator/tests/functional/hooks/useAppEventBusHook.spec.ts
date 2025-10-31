import { describe, expect, it } from "@jest/globals"
import { ApplicationEventBus, useAppEventBus } from "../../../src"

describe("> UseAppEventBus hook tests", () => {
	it("should get the app event bus instance", () => {
		const actualAppEventBus = useAppEventBus()
		const expectedAppEventBus = ApplicationEventBus.getInstance()

		expect(actualAppEventBus).toBeDefined()
		expect(actualAppEventBus).toBe(expectedAppEventBus)
	})
})
