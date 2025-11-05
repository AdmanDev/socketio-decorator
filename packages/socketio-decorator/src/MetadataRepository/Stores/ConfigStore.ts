import { SiodConfig } from "../../Models/SiodConfig"

/**
 * Store for managing global configuration
 */
export class ConfigStore {
	private static config: SiodConfig

	/**
	 * Sets the configuration object
	 * @param {SiodConfig} configuration The configuration object
	 */
	public static set (configuration: SiodConfig): void {
		this.config = configuration
	}

	/**
	 * Gets the configuration object
	 * @returns {SiodConfig} The configuration object
	 */
	public static get (): SiodConfig {
		return this.config
	}
}
