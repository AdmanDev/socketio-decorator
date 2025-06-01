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
 * This function is useful for checking if the middleware functions are called in the correct order.
 * @param {Array<jest.SpiedFunction<(...args: any[]) => unknown>>} spies Spies to check
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function expectCallOrder (...spies: jest.SpiedFunction<(...args: Any[]) => unknown>[]) {
	for (let i = 0; i < spies.length - 1; i++) {
		const nexSpyIndex = i + 1
		if (nexSpyIndex >= spies.length) {
			return
		}

		const currentSpy = spies[i]
		const nextSpy = spies[nexSpyIndex]

		const currentSpyCallOrder = currentSpy.mock.invocationCallOrder[0]
		const nextSpyCallOrder = nextSpy.mock.invocationCallOrder[0]

		expect(currentSpyCallOrder).toBeLessThan(nextSpyCallOrder)
	}
}