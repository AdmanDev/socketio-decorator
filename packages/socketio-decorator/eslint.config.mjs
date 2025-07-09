import js from "@eslint/js"
import typescriptEslint from "@typescript-eslint/eslint-plugin"
import tsParser from "@typescript-eslint/parser"
import jsdoc from "eslint-plugin-jsdoc"
import stylistic from "@stylistic/eslint-plugin"
import globals from "globals"

const cleanGlobals = (g) =>
	Object.fromEntries(Object.entries(g).map(([k, v]) => [k.trim(), v]))

export default [
	js.configs.recommended,
	{
		files: ["**/*.ts"],
		languageOptions: {
			parser: tsParser,
			ecmaVersion: 2021,
			sourceType: "module",
			globals: {
				...cleanGlobals(globals.node),
				...cleanGlobals(globals.commonjs),
				...cleanGlobals(globals.browser),
			},
		},
		plugins: {
			"@typescript-eslint": typescriptEslint,
			jsdoc,
			stylistic,
		},
		rules: {
			...typescriptEslint.configs.recommended.rules,
			...jsdoc.configs.recommended.rules,

			// stylistic rules :
			"stylistic/arrow-spacing": "warn",
			"stylistic/block-spacing": "warn",
			"stylistic/brace-style": "warn",
			"stylistic/comma-spacing": ["warn", { "before": false, "after": true }],
			"stylistic/comma-style": ["warn", "last"],
			"stylistic/computed-property-spacing": ["warn", "never"],
			"stylistic/dot-location": ["warn", "property"],
			"stylistic/indent": ["warn", "tab", {
				"SwitchCase": 1,
				"MemberExpression": 1,
				"ArrayExpression": 1,
				"ObjectExpression": 1,
				"offsetTernaryExpressions": true,
				"FunctionDeclaration": { "parameters": "first" },
				"CallExpression": { "arguments": 1 },
			}],
			"stylistic/key-spacing": ["warn", { "beforeColon": false, "afterColon": true }],
			"stylistic/keyword-spacing": ["warn", { "before": true, "after": true }],
			"stylistic/max-len": [
				"warn",
				{
					"code": 130,
					"tabWidth": 4,
					"ignoreComments": true,
					"ignoreTrailingComments": true,
					"ignoreUrls": true,
					"ignoreStrings": true,
					"ignoreTemplateLiterals": true,
					"ignoreRegExpLiterals": true
				}
			],
			"stylistic/max-statements-per-line": ["warn", { "max": 1 }],
			"stylistic/no-multi-spaces": ["warn", {
				"ignoreEOLComments": false,
				"exceptions": {
					"VariableDeclarator": true,
					"ImportDeclaration": true,
					"ExportDeclaration": true,
					"Property": true,
				},
			}],
			"stylistic/no-multiple-empty-lines": ["warn", { "max": 1, "maxBOF": 0, "maxEOF": 0 }],
			"stylistic/no-tabs": ["warn", { "allowIndentationTabs": true }],
			"stylistic/no-trailing-spaces": "warn",
			"stylistic/no-whitespace-before-property": "warn",
			"stylistic/object-property-newline": ["warn", {
				"allowAllPropertiesOnSameLine": false,
			}],
			"stylistic/quotes": ["warn", "double"],
			"stylistic/semi": ["warn", "never"],
			"stylistic/space-before-function-paren": "warn",
			"stylistic/space-in-parens": ["warn", "never"],
			"stylistic/space-infix-ops": "warn",
			"stylistic/space-unary-ops": ["warn", { "words": true, "nonwords": false }],
			"stylistic/switch-colon-spacing": "warn",

			// ✅ ESLint core rules
			"camelcase": "warn",
			"default-case": "warn",
			"default-case-last": "warn",
			"eqeqeq": "warn",
			"implicit-arrow-linebreak": ["warn", "beside"],
			"prefer-const": "warn",
			"func-call-spacing": ["warn", "never"],
			"no-empty": "warn",
			"no-undef": "off",

			// ✅ TypeScript rules
			"@typescript-eslint/ban-types": "off",
			"@typescript-eslint/no-wrapper-object-types": "off",
			"@typescript-eslint/no-unsafe-function-type": "off",
			"@typescript-eslint/no-unused-vars": "warn",

			// ✅ JSDoc rules
			"jsdoc/require-jsdoc": [1, {
				"contexts": [
					"ClassDeclaration",
					"FunctionDeclaration",
					"MethodDefinition",
				],
			}],
			"jsdoc/require-property-description": 1,
			"jsdoc/require-description": 1,
			"jsdoc/require-param-type": 1,
			"jsdoc/require-returns-type": 1,
		},
	},
	{
		files: ["tests/**/*.spec.ts"],
		rules: {
			"jsdoc/require-jsdoc": "off",
			"stylistic/max-len": "off",
		},
	},
]
