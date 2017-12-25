import highlightjs from "highlight.js";
import marked from "marked";

import {getLanguage} from "./languages";

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

export default format;
