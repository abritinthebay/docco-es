// Languages
// =============
// Functions that allow us to match a file extension to a language and it's related properties.

import path from "path";
import fs from "fs-extra";

// Languages are stored in JSON in the file `resources/languages.json`.
// Each item maps the file extension to the name of the language and the
// `symbol` that indicates a line comment. To add support for a new programming
// language to Docco, just add it to the file.
const unparsedLanguages = JSON.parse(fs.readFileSync(path.join(__dirname, "../resources", "languages.json")));

// Build out the appropriate matchers and delimiters for each language.
const buildMatchers = function(languages) {
	return Object.entries(languages).reduce((acc, [extension, lang]) => {
		if (typeof lang === "object") {
			// Does the line begin with a comment?
			lang.commentMatcher = new RegExp(`^\\s*${lang.symbol}\\s?`);
			// Ignore Shebangs/Hashbangs and interpolations
			lang.commentFilter = /(^#![/]|^\s*#\{)/;
			acc[extension] = lang;
		}
		return acc;
	}, {});
};

export const languages = buildMatchers(unparsedLanguages);

// A function to get the current language we're documenting, based on the
// file extension. Detect and tag "literate" `.ext.md` variants.
export const getLanguage = function(source, config = {}) {
	const ext = config.extension || path.extname(source) || path.basename(source);
	const langList = config.languages && Object.keys(config.languages).length ? config.languages : languages;
	const lang = langList[ext];
	if (lang && lang.name === "markdown") {
		const codeExt = path.extname(path.basename(source, ext));
		const codeLang = langList[codeExt];
		if (codeExt && codeLang) {
			return {
				...codeLang,
				literate: true
			};
		}
	}
	return lang;
};
