/** @type {import('ts-jest').JestConfigWithTsJest} **/
module.exports = {
	clearMocks: true,
	testEnvironment: "node",
	transform: {
		"^.+.tsx?$": [
			"ts-jest", {
				tsconfig: "./tests/tsconfig.json"
			}
		],
	},
	modulePathIgnorePatterns: ["dist"],
	setupFilesAfterEnv: ["./jest.setup.ts"],

}