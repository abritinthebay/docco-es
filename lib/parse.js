import {getLanguage} from "./languages";

// Given a string of source code, **parse** out each block of prose and the code that
// follows it — by detecting which is which, line by line — and then create an
// individual **section** for it. Each section is an object with `docsText` and
// `codeText` properties, and eventually `docsHtml` and `codeHtml` as well.
export const parse = function(source, code, config = {}) {
	const sections = [];
	const lang = getLanguage(source, config);
	let codeText, docsText;
	let hasCode = docsText = codeText = "";
	let lines = code.split("\n");
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
		let isText = true;
		lines = lines.map((line) => {
			const match = litRegex.exec(line);
			if (match) {
				isText = false;
				return line.slice(match[0].length);
			} else if (line.search(searchRegex)) {
				return isText ? lang.symbol : "";
			}
			isText = true;
			return `${lang.symbol } ${ line}`;
		});
	}

	const docsRegex = /^(---+|===+)$/;
	for (const line of lines) {
		if (line && line.match(lang.commentMatcher) && !line.match(lang.commentFilter)) {
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

export default parse;
