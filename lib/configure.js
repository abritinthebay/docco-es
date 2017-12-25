// Configuration
// =============
// For any particular run of Docco we might use a passed-in external template,
// or one of the built-in **layouts**. Plus we have to set up a few internal options.

import template from "lodash.template";
import fs from "fs-extra";
import path from "path";

import defaults from "./defaults";
import {getLanguage} from "./languages";

// This is a simple way of picking which keys from an object you want returned.
// eg: `pick({foo: "bar", a: "b", c: "d"}, "foo", "c") === {foo: "bar", c: "d"}`
const pick = (obj, ...keys) => {
	return keys.reduce((acc, key) => {
		if (obj.hasOwnProperty(key)) {
			acc[key] = obj[key];
		}
		return acc;
	}, {});
};


// This function builds the main configuration object.
const configure = function(options) {
	// First we set up the base config object.
	// We use the defaults and then any keys from defaults that are in the options object.
	const config = {
		...defaults,
		...pick(options, ...Object.keys(defaults))
	};
	// The user is able to override the layout file used with the `--template` parameter.
	// In this case, it is also neccessary to explicitly specify a stylesheet file.
	// These custom templates are compiled exactly like the predefined ones, but the `public` folder
	// is only copied for the latter.
	if (options.template) {
		// If a custom template was provided we will use it but usually
		// we expect a custom css file too. However there is no *requirement* for this.
		if (!options.css) {
			global.console.warn("docco: have a template but no stylesheet file specified.");
		}
		// Templates take precidence, so if we're using a template there is no layout.
		// Lets make sure of that.
		config.layout = null;
	} else {
		// We're using a layout. So lets save the layout name before moving on.
		config.layoutname = config.layout;
		const dir = config.layout = path.join(__dirname, "../resources", config.layout);
		// If the layout has a public directory (for resources like css, images, etc) lets set that.
		if (fs.existsSync(path.join(dir, "public"))) {
			config.public = path.join(dir, "public");
		}
		// Templates are always named the same thing.
		config.template = path.join(dir, "docco.jst");
		// Note that a custom css file can be provided to override the layouts own.
		config.css = options.css || path.join(dir, "docco.css");
	}
	// Now we try to load everything we set up above.
	try {
		config.template = template(fs.readFileSync(config.template).toString());
	} catch (err) {
		global.console.log(`docco: could not load layout "${config.layoutname}", aborting`);
		process.exit(!!err); // eslint-disable-line no-process-exit
	}
	// If we're using custom markdown options we load those from a file now.
	if (options.marked) {
		config.marked = JSON.parse(fs.readFileSync(options.marked));
	}
	// We only support what we can read.
	// If docco is called with `docco *.*` we don't want to try to read `.gif` files or something.
	// So lets filter out those langauges we don't support.
	// Want to add a language? [Submit a PR](https://github.com/abritinthebay/docco-es)!
	config.sources = options.args.filter(function(source) {
		const lang = getLanguage(source, config);
		if (!lang && config.verbose) {
			global.console.warn(`docco: skipped unknown type (${path.basename(source)})`);
		}
		return lang;
	}).sort();
	// We're done! Return the completed configuration object.
	return config;
};

export default configure;
