const isFileMock = jest.fn()

jest.mock("fs", () => ({
	readdirSync: jest.fn(),
	statSync: jest.fn(() => ({
		isFile: isFileMock
	}))
}))

import { beforeEach, describe, expect, it, jest } from "@jest/globals"
import { Server } from "socket.io"
import { SocketOn, useSocketIoDecorator } from "../../src"
import { ModuleUtils } from "../../src/Utils/ModuleUtils"
import { IoCContainer } from "../../src/IoCContainer"

const mockedImport = jest.spyOn(ModuleUtils, "import")

describe("> Module auto import tests", () => {

	beforeEach(() => {
		IoCContainer["container"] = new Map()
	})

	describe("Controller auto import", () => {
		const fakeControllerInstance = jest.fn()
		const fakeControllerInstance2 = jest.fn()

		class FakeController {
			constructor () {
				fakeControllerInstance()
			}

			@SocketOn("message")
			public onMessage () { /* A test */ }
		}

		class FakeController2 {
			constructor () {
				fakeControllerInstance2()
			}

			@SocketOn("message2")
			public onMessage2 () { /* A test */ }
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
				controllers: [`${fakeDirPath}/*.js`],
				ioserver: {
					on: jest.fn(),
					of: jest.fn().mockReturnThis()
				} as unknown as Server,
			})

			expect(fs.readdirSync).toHaveBeenCalledWith(fakeDirPath)
			expect(fakeControllerInstance).toHaveBeenCalledTimes(1)
		})

		it("should import controllers from multiple paths", async () => {
			const fakeDirPath1 = "/fake/1/path"
			const fakeDirPath2 = "/fake/2/path"
			const fakeControllerPath1 = `${fakeDirPath1}/controller1.js`
			const fakeControllerPath2 = `${fakeDirPath2}/controller2.js`

			const fs = await import("fs") as Any
			fs.readdirSync
				.mockReturnValueOnce([fakeControllerPath1])
				.mockReturnValueOnce([fakeControllerPath2])

			mockedImport
				.mockResolvedValueOnce({
					controller: FakeController
				}).mockResolvedValueOnce({
					controller: FakeController2
				})

			isFileMock.mockReturnValue(true)

			await useSocketIoDecorator({
				controllers: [`${fakeDirPath1}/*.js`, `${fakeDirPath2}/*.js`],
				ioserver: {
					on: jest.fn(),
					of: jest.fn().mockReturnThis()
				} as unknown as Server,
			})

			expect(fs.readdirSync).toHaveBeenCalledWith(fakeDirPath1)
			expect(fs.readdirSync).toHaveBeenCalledWith(fakeDirPath2)
			expect(fakeControllerInstance).toHaveBeenCalledTimes(1)
			expect(fakeControllerInstance2).toHaveBeenCalledTimes(1)
		})
	})
})