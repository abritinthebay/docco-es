// Configuration
// =============
// For any particular run of Docco we might use a passed-in external template,
// or one of the built-in **layouts**. Plus we have to set up a few internal options.

import template from "lodash.template";
import fs from "fs-extra";
import path from "path";
import Zip from "adm-zip";

import defaults from "./defaults";
import {getLanguage} from "./languages";

// This is a simple way of picking which keys from an object you want returned.
// eg: `pick({foo: "bar", a: "b", c: "d"}, "foo", "c") === {foo: "bar", c: "d"}`
export const pick = (obj, ...keys) => {
	return keys.reduce((acc, key) => {
		if (obj.hasOwnProperty(key)) {
			acc[key] = obj[key];
		}
		return acc;
	}, {});
};


// This function builds the main configuration object.
export const configure = function(options) {
	// First we set up the base config object.
	// We use the defaults and then any keys from defaults that are in the options object.
	const config = {
		...defaults,
		...pick(options, ...Object.keys(defaults))
	};
	// The user is able to specify a template Zip File that contains a template file and a css file
	// The zip option takes priority over the other template options.
	if (config.zip) {
		// We open the zip and find the files.
		// If *both* the template and the css are not present then we warn the user.
		try {
			// Loading of the zip is wrapped in a try
			// so if anything goes wrong we can gracefully exit.
			const data = new Zip(config.zip);
			data.getEntries().map((entry) => {
				if (entry.entryName === "docco.jst" && !entry.isDirectory) {
					config.template = template(entry.getData().toString("utf8"));
				}
				if (entry.entryName === "docco.css" && !entry.isDirectory) {
					config.styles = entry.getData().toString("utf8");
				}
				if (entry.entryName.startsWith("public/") && !entry.isDirectory) {
					config.public = Array.isArray(config.public) ? config.public : [];
					config.public.push({
						name: entry.entryName,
						data: entry.getData()
					});
				}
			});
		} catch (_err) {
			global.console.warn("docco: invalid zip file.");
			return false;
		}
	} else {
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
		} catch (_err) {
			global.console.warn(`docco: could not load layout template "${config.layoutname || config.template}"`);
			config.template = false;
		}
	}
	// If we're using custom markdown options we load those from a file now.
	if (options.marked) {
		config.marked = JSON.parse(fs.readFileSync(options.marked));
	}
	// We only support what we can read.
	// If docco is called with `docco *.*` we don't want to try to read `.gif` files or something.
	// So lets filter out those langauges we don't support.
	// Want to add a language? [Submit a PR](https://github.com/abritinthebay/docco-es)!
	config.sources = Array.isArray(options.args) ? options.args.filter(function(source) {
		const lang = getLanguage(source, config);
		if (!lang && config.verbose) {
			global.console.warn(`docco: skipped unknown type (${path.basename(source)})`);
		}
		return lang;
	}).sort() : [];
	// We're done! Return the completed configuration object.
	return config;
};

export default configure;
