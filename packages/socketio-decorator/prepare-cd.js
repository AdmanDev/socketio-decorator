const shelljs = require("shelljs")
const pkg = require("./package.json")

// ---------------------------------------- Copy package.json ---------------------------------------- //
delete pkg.devDependencies
delete pkg.scripts
delete pkg.files

// Replace "dist" with "."
let pkgJson = JSON.stringify(pkg, null, 2)
pkgJson = pkgJson.replace(/"\.\/dist\//g, "\"./")
pkgJson = pkgJson.replace(/"dist\//g, "\"./")

shelljs.mkdir("-p", "dist")
shelljs.ShellString(pkgJson).to("dist/package.json")

// ---------------------------------------- Copy files ---------------------------------------- //
shelljs.cp("../../README.md", "dist/README.md")
shelljs.cp("../../LICENSE", "dist/LICENSE")
