import commander from "commander";
import underscore from "underscore";
import fs from "fs-extra";
import path from "path";

import defaults from "./defaults";
import document from "./document";

// Keep it DRY. Extract the docco **version** from `package.json`
export const version = JSON.parse(fs.readFileSync(path.join(__dirname, "../package.json"))).version;

// Command Line Interface
// ----------------------

// Finally, let's define the interface to run Docco from the command line.
// Parse options using [Commander](https://github.com/visionmedia/commander.js).
export const cli = function(args = process.argv) {
	global.console.log(`
	       __
	  ____/ /___  ______________        ___  _____
	 / __  / __ \\/ ___/ ___/ __ \\______/ _ \\/ ___/
	/ /_/ / /_/ / /__/ /__/ /_/ /_____/  __(__  )
	\\__,_/\\____/\\___/\\___/\\____/      \\___/____/

   The Quick & Simple Literate Doccumentation Generator
	`);
	commander.version(version)
		.usage("[options] files")
		.option("-L, --languages [file]", "use a custom languages.json", underscore.compose(JSON.parse, fs.readFileSync))
		.option("-l, --layout [name]", "choose a layout (parallel, linear or classic)", defaults.layout)
		.option("-o, --output [path]", "output to a given folder", defaults.output)
		.option("-c, --css [file]", "use a custom css file", defaults.css)
		.option("-t, --template [file]", "use a custom .jst template", defaults.template)
		.option("-e, --extension [ext]", "assume a file extension for all inputs", defaults.extension)
		.option("-m, --marked [file]", "use custom marked options", defaults.marked)
		.option("-T, --throw", "throw errors if code syntax highlighting fails", defaults.throw)
		.option("-v, --verbose", "shows all files as they are proccessed rather than a summary", defaults.verbose)
		.parse(args).name = "docco";
	if (commander.args.length) {
		return document(commander);
	}
	return global.console.log(commander.helpInformation());
};

export default cli;
