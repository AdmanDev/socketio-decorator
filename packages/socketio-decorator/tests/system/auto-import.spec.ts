const isFileMock = jest.fn()

jest.mock("fs", () => ({
	readdirSync: jest.fn(),
	statSync: jest.fn(() => ({
		isFile: isFileMock
	}))
}))

import { afterAll, describe, expect, it, jest } from "@jest/globals"
import { SocketOn, useSocketIoDecorator } from "../../src"
import { Server } from "socket.io"
import { ModuleUtils } from "../../src/Utils/ModuleUtils"

const mockedImport = jest.spyOn(ModuleUtils, "import")

describe("> Module auto import tests", () => {

	afterAll(() => {
		jest.resetModules()
	})

	describe("Controller auto import", () => {
		const fakeControllerInstance = jest.fn()

		class FakeController {
			constructor () {
				fakeControllerInstance()
			}

			@SocketOn("message")
			public onMessage () { /* A test */ }
		}

		it("should import controllers from a given path", async () => {
			const fakeDirPath = "/fake/path"
			const fakeControllerPath = `${fakeDirPath}/controller1.js`
			const fakeNonFilePath = `${fakeDirPath}/subdir`

			const fs = await import("fs") as Any
			fs.readdirSync.mockReturnValue([fakeControllerPath, fakeNonFilePath])

			mockedImport.mockResolvedValue({
				controller: FakeController
			})

			isFileMock.mockReturnValueOnce(true)
				.mockReturnValueOnce(false)

			await useSocketIoDecorator({
				controllers: ["/fake/path/*.js"],
				ioserver: {
					on: jest.fn(),
				} as unknown as Server,
			})

			expect(fs.readdirSync).toHaveBeenCalledWith(fakeDirPath)
			expect(fakeControllerInstance).toHaveBeenCalledTimes(1)
		})
	})
})