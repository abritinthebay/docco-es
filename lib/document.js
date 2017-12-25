import fs from "fs-extra";
import path from "path";
import {promisify} from "util";

import configure from "./configure";
import parse from "./parse";
import format from "./format";
import write from "./write";

// Simple Promisified version of the Node fs.readFile. Useful for async batching.
const readFileAsync = promisify(fs.readFile);

const errorCallback = (error) => {
	if (error) {
		throw error;
	}
};

const copyAsset = function(file, output, callback) {
	if (!fs.existsSync(file)) {
		return callback();
	}
	return fs.copy(file, path.join(output, path.basename(file)), callback);
};

// Factory that returns a function that processes a source file.
const processSourcesFactory = function(config, callback) {
	return (source) => {
		// We first read the file
		return readFileAsync(source)
			.then((buffer) => {
				// then we parse the code, format it into sections, and finally write it to a file.
				const code = buffer.toString();
				const sections = format(source, parse(source, code, config), config);
				write(source, sections, config);
				config.writtenSources = (config.writtenSources || 0) + 1;
			})
			.catch(callback);
	};
};

// Simply Factory method that builds a function which, as long as there is no error,
// will copy the layout's files (if any) from its public folder to the output folder.
const copyLayoutFactory = function(config, callback) {
	return function(error) {
		if (error) {
			return callback(error);
		}
		if (fs.existsSync(config.public)) {
			return copyAsset(config.public, config.output, callback);
		}
		return callback();
	};
};

// Document is the function that actaully creates the documentation.
export const document = function(options = {}, callback = errorCallback) {
	// First we get a config object from the passed options.
	const config = configure(options);
	// Then we make the output directory (if we need to)
	global.console.log("docco: creating output directory (if required)");
	return fs.mkdirs(config.output, function() {
		global.console.log("docco: processing sources");
		// Once the output directory exists we can process the source files.
		const operations = config.sources.map(processSourcesFactory(config, callback));
		// We batch the Promises that are now in the operations constant
		// so we can trigger an event when they all are done (or fast-fail).
		return Promise.all(operations)
			.then(() => {
				// Once we're all done - copy the layouts css and other assets if required.
				global.console.log(`docco: processed and wrote ${config.writtenSources} files to directory: ${config.output}`);
				return copyAsset(config.css, config.output, copyLayoutFactory(config, callback));
			})
			.catch(callback);
	});
};

export default document;
