import template from "lodash.template";
import fs from "fs-extra";
import path from "path";

import defaults from "./defaults";
import {getLanguage} from "./languages";

const pick = (obj, ...keys) => {
	return keys.reduce((acc, key) => {
		if (obj.hasOwnProperty(key)) {
			acc[key] = obj[key];
		}
		return acc;
	}, {});
};

// **Configure** this particular run of Docco. We might use a passed-in external
// template, or one of the built-in **layouts**. We only attempt to process
// source files for languages for which we have definitions.
const configure = function(options) {
	const config = {
		...defaults,
		...pick(options, ...Object.keys(defaults))
	};
	// The user is able to override the layout file used with the `--template` parameter.
	// In this case, it is also neccessary to explicitly specify a stylesheet file.
	// These custom templates are compiled exactly like the predefined ones, but the `public` folder
	// is only copied for the latter.
	if (options.template) {
		if (!options.css) {
			global.console.warn("docco: no stylesheet file specified");
		}
		config.layout = null;
	} else {
		config.layoutname = config.layout;
		const dir = config.layout = path.join(__dirname, "../resources", config.layout);
		if (fs.existsSync(path.join(dir, "public"))) {
			config.public = path.join(dir, "public");
		}
		config.template = path.join(dir, "docco.jst");
		config.css = options.css || path.join(dir, "docco.css");
	}
	try {
		config.template = template(fs.readFileSync(config.template).toString());
	} catch (err) {
		global.console.log(`docco: could not load layout "${config.layoutname}", aborting`);
		process.exit(!!err); // eslint-disable-line no-process-exit
	}
	if (options.marked) {
		config.marked = JSON.parse(fs.readFileSync(options.marked));
	}
	config.sources = options.args.filter(function(source) {
		const lang = getLanguage(source, config);
		if (!lang) {
			global.console.warn(`docco: skipped unknown type (${path.basename(source)})`);
		}
		return lang;
	}).sort();
	return config;
};

export default configure;
