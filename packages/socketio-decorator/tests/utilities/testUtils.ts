/**
 * Sleep during given time in Ms
 * @param {number} duration Sleeping duration
 */
export async function waitFor (duration: number) {
	const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))
	await delay(duration)
}