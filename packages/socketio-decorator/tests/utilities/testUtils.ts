import { jest, expect } from "@jest/globals"

/**
 * Sleep during given time in Ms
 * @param {number} duration Sleeping duration
 */
export async function waitFor (duration: number) {
	const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))
	await delay(duration)
}

/**
 * Checks if the given spies were called in the same order as given in the argument list.
 * This function is useful for checking if the functions are called in the correct order.
 * @param {Record<string, jest.SpiedFunction<(...args: any[]) => unknown>>} namedSpies Object where keys are spy names and values are the spy functions
 */
export function expectCallOrder (namedSpies: Record<string, jest.SpiedFunction<(...args: Any[]) => unknown>>) {
	const spyEntries = Object.entries(namedSpies)
	const spies = spyEntries.map(([name, spy]) => ({
		name,
		spy
	}))

	const callOrders = spies.map((item, index) => ({
		position: index,
		name: item.name,
		callOrder: item.spy.mock.invocationCallOrder[0]
	}))

	for (let i = 0; i < spies.length - 1; i++) {
		const nextSpyIndex = i + 1
		if (nextSpyIndex >= spies.length) {
			return
		}

		const currentItem = spies[i]
		const nextItem = spies[nextSpyIndex]

		const currentSpyCallOrder = currentItem.spy.mock.invocationCallOrder[0]
		const nextSpyCallOrder = nextItem.spy.mock.invocationCallOrder[0]
		const currentSpyName = currentItem.name
		const nextSpyName = nextItem.name

		if (currentSpyCallOrder >= nextSpyCallOrder) {
			// Build detailed error message with all call orders
			const orderedByCallOrder = [...callOrders].sort((a, b) => a.callOrder - b.callOrder)
			const callOrderList = orderedByCallOrder
				.map(item => `    [${item.callOrder}] ${item.name}`)
				.join("\n")

			throw new Error(
				"\nCall order violation:\n" +
				`  Expected: "${currentSpyName}" should be called BEFORE "${nextSpyName}"\n` +
				`  But: "${currentSpyName}" was called at order ${currentSpyCallOrder}, "${nextSpyName}" was called at order ${nextSpyCallOrder}\n` +
				`  (${currentSpyCallOrder} >= ${nextSpyCallOrder})\n\n` +
				`  Actual execution order:\n${callOrderList}\n`
			)
		}
	}
}