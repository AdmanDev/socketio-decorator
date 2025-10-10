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
		const configCopy: SiodConfig = { ...config }

		const propertiesToImport: (keyof SiodConfig)[] = [
			"controllers",
			"appEventListeners"
		]

		for (const property of propertiesToImport) {
			const propertyValue = configCopy[property]
			const isNotEmptyArray = Array.isArray(propertyValue) && propertyValue.length > 0

			if (!isNotEmptyArray) {
				continue
			}

			const paths = propertyValue.filter(path => typeof path === "string")
			if (paths.length > 0) {
				configCopy[property] = await ModuleUtils.loadModulesFromPatterns(paths) as Any
			}
		}

		return configCopy
	}

	/**
	 * Resolves modules from the specified paths.
	 * @param {string[]} paths - An array of paths to resolve modules from.
	 * @returns {Promise<Function[]>} - A promise that resolves to an array of imported modules.
	 */
	public static async loadModulesFromPatterns (paths: string[]) {
		const modules: Function[] = []

		for (const pathPattern of paths) {
			const importedModules = await ModuleUtils.importModules(pathPattern)
			modules.push(...importedModules)
		}

		return modules
	}

	/**
	 * Imports modules from the given path pattern
	 * @param {string} pathPattern - The glob pattern for finding modules
	 * @returns {Promise<Function[]>} - A promise that resolves to an array of imported modules
	 */
	public static async importModules (pathPattern: string) {
		const files = fs.readdirSync(path.dirname(pathPattern))
			.filter(file => {
				const fullPath = path.join(path.dirname(pathPattern), file)
				// Ensure file matches pattern - convert glob pattern to regex
				const pattern = path.basename(pathPattern).replace(/\*/g, ".*")

				const isFile = fs.statSync(fullPath).isFile()
				const isFileMatchingPattern = new RegExp(`^${pattern}$`).test(file)

				return isFileMatchingPattern && isFile
			})
			.map(file => path.join(path.dirname(pathPattern), file))

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