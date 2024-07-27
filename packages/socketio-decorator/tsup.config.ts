import { defineConfig } from "tsup"

export default defineConfig({
	tsconfig: "./tsconfig.json",
	format: ["cjs", "esm"],
	entry: ["./src/index.ts"],
	dts: true,
	shims: true,
	skipNodeModulesBundle: true,
	clean: true
})
