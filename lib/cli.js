// Command Line Interface
// ----------------------
// The core part of the CLI is here. Mostly it provides a useful, simplifed
// interface around the component parts. Running it locally is as simple as
// `cli(opts)`, in fact this is how the binary works internally.
//
// Import our external dependancies.
import commander from "commander";
import fs from "fs-extra";
import path from "path";

// Import our internal dependancies
import defaults from "./defaults";
import document from "./document";

// Extract the docco version from `package.json`
// We're exporting this so it is available elsewhere.
export const version = JSON.parse(fs.readFileSync(path.join(__dirname, "../package.json"))).version;

// Helper function for reading the data from a provided Languages JSON file.
export const readLanguages = (...args) => JSON.parse(fs.readFileSync(...args));

// Finally, let's define the interface to run Docco from the command line.
// Parse options using [Commander](https://github.com/visionmedia/commander.js).
// Programatically using the CLI function is possible by simply importing it and
// then running `cli({...yourArguments})`
export const cli = function(args = process.argv, generate = document) {
	// First, log the logo/description.
	global.console.log(`
	       __
	  ____/ /___  ______________        ___  _____
	 / __  / __ \\/ ___/ ___/ __ \\______/ _ \\/ ___/
	/ /_/ / /_/ / /__/ /__/ /_/ /_____/  __(__  )
	\\__,_/\\____/\\___/\\___/\\____/      \\___/____/

   The Quick & Simple Literate Doccumentation Generator
	`);
	// Now we use Commander to both describe the options and then parse the arguments.
	commander.version(version)
		.usage("[options] files")
		.option("-L, --languages [file]", "use a custom languages.json", readLanguages)
		.option("-l, --layout [name]", "choose a layout (parallel, linear or classic)", defaults.layout)
		.option("-o, --output [path]", "output to a given folder", defaults.output)
		.option("-c, --css [file]", "use a custom css file", defaults.css)
		.option("-t, --template [file]", "use a custom .jst template", defaults.template)
		.option("-e, --extension [ext]", "assume a file extension for all inputs", defaults.extension)
		.option("-m, --marked [file]", "use custom marked options", defaults.marked)
		.option("-d, --dryrun", "don't write any files, just process them", defaults.dryrun)
		.option("-T, --throw", "throw errors if code syntax highlighting fails", defaults.throw)
		.option("-v, --verbose", "shows all files as they are proccessed rather than a summary", defaults.verbose)
		.option("-z, --zip [file]", "use layout files compressed as a zip", defaults.zip)
		.parse(args).name = "docco";
	// If we have parse arguments then we were called with files.
	// Lets try to build the documentation.
	if (commander.args.length) {
		return generate(commander);
	}
	// If we weren't, then just log the help text (a description of the options above).
	return global.console.log(commander.helpInformation());
};

export default cli;
