// The Core Code
// =============
//
// This file sets up the core API for the application.
// First we require our internal dependencies.
import parse from "./parse";
import format from "./format";
import document from "./document";
import cli from "./cli";
import {version} from "./cli";

// Then we export our public API.
export default {
	document,
	format,
	parse,
	cli,
	version
};

// Also export these as named exports
export {
	document,
	format,
	parse,
	cli,
	version
};

// The core function called by the CLI is, unsurprisingly, called `cli`.
// However with it (and the other functions) you can programatically use docco.
