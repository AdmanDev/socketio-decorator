import { SiodConfig } from "../Models/SiodConfig"
import * as path from "path"
import * as fs from "fs"
import { pathToFileURL } from "url"

/**
 * Defines utility functions for module operations.
 */
export class ModuleUtils {
	/**
	 * Resolves the auto-import modules from the given Siod configuration.
	 * @param {SiodConfig} config - The Siod configuration.
	 * @returns {Promise<SiodConfig>} - A promise that resolves to the updated configuration with imported modules.
	 */
	public static async resolveAutoImportFromConfig (config: SiodConfig): Promise<SiodConfig> {
		const configCopy = { ...config }

		const controllerPaths = configCopy.controllers.filter(c => typeof c === "string")
		if (controllerPaths.length > 0) {
			configCopy.controllers = await ModuleUtils.resolveModulesFromPath(controllerPaths)
		}

		return configCopy
	}

	/**
	 * Resolves modules from the specified paths.
	 * @param {string[]} paths - An array of paths to resolve modules from.
	 * @returns {Promise<Function[]>} - A promise that resolves to an array of imported modules.
	 */
	public static async resolveModulesFromPath (paths: string[]) {
		let modules: Function[] = []
		if (paths.length > 0) {
			modules = await ModuleUtils.importModules(paths[0])
		}

		return modules
	}

	/**
	 * Imports modules from the given path pattern
	 * @param {string} modulePath - The glob pattern for finding modules
	 * @returns {Promise<Function[]>} - A promise that resolves to an array of imported modules
	 */
	public static async importModules (modulePath: string) {
		const files = fs.readdirSync(path.dirname(modulePath))
			.filter(file => {
				const fullPath = path.join(path.dirname(modulePath), file)
				// Ensure file matches pattern - convert glob pattern to regex
				const pattern = path.basename(modulePath).replace(/\*/g, ".*")
				return new RegExp(`^${pattern}$`).test(file) && fs.statSync(fullPath).isFile()
			})
			.map(file => path.join(path.dirname(modulePath), file))

		const modules: Function[] = []
		for (const file of files) {
			const url = pathToFileURL(file).href
			const controller = await ModuleUtils.import(url)

			for (const exported of Object.values(controller)) {
				if (typeof exported === "function") {
					modules.push(exported)
				}
			}
		}

		return modules
	}

	/**
	 * Imports a module dynamically.
	 * @param {string} modulePath The path to the module to import
	 * @returns {Promise<unknown>} A promise that resolves to the imported module
	 */
	public static async import (modulePath: string) {
		return await import(modulePath)
	}
}