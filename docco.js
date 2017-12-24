// Docco
// =====

// **Docco-ES** is a quick-and-simple documentation generator, written in
// [modern, ES2015+, JavaScript](https://babeljs.io/learn-es2015/).
//
// It produces an HTML document that displays your comments intermingled with your
// code. All prose is passed through
// [Markdown](http://daringfireball.net/projects/markdown/syntax), and code is
// passed through [Highlight.js](http://highlightjs.org/) for syntax highlighting.
//
// This page is actually the result of running Docco against its own
// [source file](https://github.com/abritinthebay/docco-es/blob/master/docco.js).

// 1. Install Docco with **npm**: `npm install -g docco`
// 2. Run it against your code: `docco src/*.js`

// There is no Step 3.

// This will generate an HTML page for each of the named
// source files, with a menu linking to the other pages, saving the whole mess
// into a `docs` folder (configurable).

// The [Docco-ES source](http://github.com/abritinthebay/docco-es) is available on GitHub,
// and is released under the MIT License.

// Docco can be used to process code written in any programming language. If it
// doesn't handle your favorite yet, feel free to
// [add it to the list](https://github.com/abritinthebay/docco-es/blob/master/resources/languages.json).
// Finally, the ["literate" style](http://coffeescript.org/#literate) of *any*
// language is also supported — just tack an `.md` extension on the end:
// `.js.md`, `.py.md`, and so on.

// Partners in Crime:
// ------------------
//
// Docco-ES is based on the excellent work of Jeremy Ashkenas who wrote the [original Docco](https://github.com/jashkenas/docco)
// in CoffeeScript. This fork was created to add features and to work with modern JS technologies
// and language features that didn't exist when it was original written or that
// CoffeeScript does not support.

// Main Documentation Generation Functions
// ---------------------------------------
// Generate the documentation for our configured source file by copying over static
// assets, reading all the source files in, splitting them up into prose+code
// sections, highlighting each file in the appropriate language, and printing them
// out in an HTML template.

// Helpers & Initial Setup
// -----------------------
// Require our external dependencies.
import {promisify} from "util";
import underscore from "underscore";
import fs from "fs-extra";
import path from "path";
import marked from "marked";
import commander from "commander";
import highlightjs from "highlight.js";

// Simple Promisified version of the Node fs.readFile. Useful for async batching.
const readFileAsync = promisify(fs.readFile);

// Languages are stored in JSON in the file `resources/languages.json`.
// Each item maps the file extension to the name of the language and the
// `symbol` that indicates a line comment. To add support for a new programming
// language to Docco, just add it to the file.
const unparsedLanguages = JSON.parse(fs.readFileSync(path.join(__dirname, "resources", "languages.json")));

// Build out the appropriate matchers and delimiters for each language.
const buildMatchers = function(languages) {
	return Object.entries(languages).reduce((acc, [extension, lang]) => {
		// Does the line begin with a comment?
		lang.commentMatcher = new RegExp(`^\\s*${lang.symbol}\\s?`);
		// Ignore Shebangs/Hashbangs and interpolations
		lang.commentFilter = /(^#![/]|^\s*#\{)/;
		acc[extension] = lang;
		return acc;
	}, {});
};

const languages = buildMatchers(unparsedLanguages);

// A function to get the current language we're documenting, based on the
// file extension. Detect and tag "literate" `.ext.md` variants.
const getLanguage = function(source, config) {
	const ext = config.extension || path.extname(source) || path.basename(source);
	const ref = config.languages;
	const lang = (ref !== null ? ref[ext] : false) || languages[ext];
	if (lang && lang.name === "markdown") {
		const codeExt = path.extname(path.basename(source, ext));
		const codeLang = languages[codeExt];
		if (codeExt && codeLang) {
			return {
				...codeLang,
				literate: true
			};
		}
	}
	return lang;
};

// Keep it DRY. Extract the docco **version** from `package.json`
export const version = JSON.parse(fs.readFileSync(path.join(__dirname, "package.json"))).version;

const errorCallback = (error) => {
	if (error) {
		throw error;
	}
};

// Given a string of source code, **parse** out each block of prose and the code that
// follows it — by detecting which is which, line by line — and then create an
// individual **section** for it. Each section is an object with `docsText` and
// `codeText` properties, and eventually `docsHtml` and `codeHtml` as well.
export const parse = function(source, code, config = {}) {
	const sections = [];
	const lang = getLanguage(source, config);
	let codeText, docsText, maybeCode;
	let hasCode = docsText = codeText = "";
	let lines = code.split("\n");
	let isText = false;
	const save = function() {
		sections.push({docsText, codeText});
		hasCode = docsText = codeText = "";
	};

	// Our quick-and-dirty implementation of the literate programming style. Simply
	// invert the prose and code relationship on a per-line basis, and then continue as
	// normal below.

	// sections
	if (lang.literate) {
		const litRegex = /^([ ]{4}|[ ]{0,3}\t)/;
		const searchRegex = /^\s*$/;
		isText = maybeCode = true;
		lines = lines.map((line) => {
			const match = litRegex.exec(line);
			if (maybeCode && match) {
				isText = false;
				return line.slice(match[0].length);
			} else if (maybeCode && line.search(searchRegex)) {
				return isText ? lang.symbol : "";
			}
			isText = true;
			return `${lang.symbol } ${ line}`;
		});
	}

	const docsRegex = /^(---+|===+)$/;
	for (const line of lines) {
		if (line.match(lang.commentMatcher) && !line.match(lang.commentFilter)) {
			if (hasCode) {
				save();
			}
			docsText += `${line.replace(lang.commentMatcher, "")}\n`;
			if (docsRegex.test(line)) {
				save();
			}
		} else {
			hasCode = true;
			codeText += `${line }\n`;
		}
	}
	save();
	return sections;
};

// To **format** and highlight the now-parsed sections of code, we use **Highlight.js**
// over stdio, and run the text of their corresponding comments through
// **Markdown**, using [Marked](https://github.com/chjj/marked).
export const format = function(source, sections, config = {}) {
	const language = getLanguage(source, config);
	// Pass any user defined options to Marked if specified via command line option
	const markedOptions = config.marked || {
		smartypants: true
	};
	marked.setOptions(markedOptions);
	// Tell Marked how to highlight code blocks within comments, treating that code
	// as either the language specified in the code block or the language of the file
	// if not specified.
	marked.setOptions({
		highlight(code, lang = language.name) {
			if (highlightjs.getLanguage(lang)) {
				return highlightjs.highlight(lang, code).value;
			}
			global.console.warn(`docco: couldn't highlight code block with unknown language '${lang}' in ${source}`);
			return code;
		}
	});

	// making sure this is an immutable operation by cloning sections.
	return [...sections].map((section) => {
		let code;
		try {
			code = highlightjs.highlight(language.name, section.codeText).value;
		} catch (err) {
			if (config.throw) {
				throw err;
			}
			code = section.codeText;
		}
		code = code.replace(/\s+$/, "");
		section.codeHtml = `<div class='highlight'><pre>${code}</pre></div>`;
		section.docsHtml = marked(section.docsText);
		return section;
	});
};

// Once all of the code has finished highlighting, we can **write** the resulting
// documentation file by passing the completed HTML sections into the template,
// and rendering it to the specified output path.
const write = function(source, sections, config) {
	var css, destination, first, firstSection, hasTitle, html, relative, title;
	destination = function(file) {
		return path.join(config.output, path.dirname(file), `${path.basename(file, path.extname(file)) }.html`);
	};
	relative = function(file) {
		var from, to;
		to = path.dirname(path.resolve(file));
		from = path.dirname(path.resolve(destination(source)));
		return path.join(path.relative(from, to), path.basename(file));
	};
	// The **title** of the file is either the first heading in the prose, or the
	// name of the source file.
	firstSection = underscore.find(sections, function(section) {
		return section.docsText.length > 0;
	});
	if (firstSection) {
		first = marked.lexer(firstSection.docsText)[0];
	}
	hasTitle = first && first.type === "heading" && first.depth === 1;
	title = hasTitle ? first.text : path.basename(source);
	css = relative(path.join(config.output, path.basename(config.css)));
	html = config.template({
		css,
		destination,
		hasTitle,
		language: getLanguage(source, config),
		path,
		relative,
		sections,
		sources: config.sources,
		title
	});
	global.console.log(`docco: ${source} -> ${destination(source)}`);
	return fs.outputFileSync(destination(source), html);
};

// Configuration
// -------------

// Default configuration **options**. All of these may be extended by
// user-specified options.
const defaults = {
	css: null,
	extension: null,
	languages: {},
	layout: "parallel",
	marked: null,
	output: "docs",
	template: null,
	throw: false
};

// **Configure** this particular run of Docco. We might use a passed-in external
// template, or one of the built-in **layouts**. We only attempt to process
// source files for languages for which we have definitions.
const configure = function(options) {
	var config, dir;
	config = underscore.extend({}, defaults, underscore.pick(options, ...underscore.keys(defaults)));
	config.languages = buildMatchers(config.languages);
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
		dir = config.layout = path.join(__dirname, "resources", config.layout);
		if (fs.existsSync(path.join(dir, "public"))) {
			config.public = path.join(dir, "public");
		}
		config.template = path.join(dir, "docco.jst");
		config.css = options.css || path.join(dir, "docco.css");
	}
	config.template = underscore.template(fs.readFileSync(config.template).toString());
	if (options.marked) {
		config.marked = JSON.parse(fs.readFileSync(options.marked));
	}
	config.sources = options.args.filter(function(source) {
		var lang;
		lang = getLanguage(source, config);
		if (!lang) {
			global.console.warn(`docco: skipped unknown type (${path.basename(source)})`);
		}
		return lang;
	}).sort();
	return config;
};


export const document = function(options = {}, callback = errorCallback) {
	var config;
	config = configure(options);
	return fs.mkdirs(config.output, function() {
		var complete, copyAsset, files, nextFile;
		copyAsset = function(file, callback) {
			if (!fs.existsSync(file)) {
				return callback();
			}
			return fs.copy(file, path.join(config.output, path.basename(file)), callback);
		};
		complete = function() {
			return copyAsset(config.css, function(error) {
				if (error) {
					return callback(error);
				}
				if (fs.existsSync(config.public)) {
					return copyAsset(config.public, callback);
				}
				return callback();
			});
		};
		files = config.sources.slice();
		nextFile = function() {
			var source;
			source = files.shift();
			return fs.readFile(source, function(error, buffer) {
				var code, sections;
				if (error) {
					return callback(error);
				}
				code = buffer.toString();
				sections = parse(source, code, config);
				format(source, sections, config);
				write(source, sections, config);
				if (files.length) {
					return nextFile();
				}
				return complete();
			});
		};
		return nextFile();
	});
};

// Command Line Interface
// ----------------------

// Finally, let's define the interface to run Docco from the command line.
// Parse options using [Commander](https://github.com/visionmedia/commander.js).
export const run = function(args = process.argv) {
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
		.parse(args).name = "docco";
	if (commander.args.length) {
		return document(commander);
	}
	return global.console.log(commander.helpInformation());
};

export default {
	document,
	format,
	parse,
	run,
	version
};
