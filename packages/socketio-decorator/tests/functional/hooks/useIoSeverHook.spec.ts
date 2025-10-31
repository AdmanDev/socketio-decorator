import { describe, expect, it } from "@jest/globals"
import { useIoServer } from "../../../src"
import { createServer } from "../../utilities/serverUtils"

describe("> UseIoServer hook tests", () => {
	it("should get the socket.io server instance", (done) => {
		const io = createServer(
			{
				controllers: [],
			},
			{
				onServerListen: () => onServerListen()
			}
		)

		const onServerListen = () => {
			const ioServer = useIoServer()

			expect(ioServer).toBe(io)
			done()
		}
	})
})
