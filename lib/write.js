import underscore from "underscore";
import fs from "fs-extra";
import path from "path";
import marked from "marked";

import {getLanguage} from "./languages";

// Once all of the code has finished highlighting, we can **write** the resulting
// documentation file by passing the completed HTML sections into the template,
// and rendering it to the specified output path.
export const write = function(source, sections, config) {
	const destination = function(file) {
		const lang = getLanguage(source, config);
		const ext = lang && lang.name === "markdown" ? "md" : "html";
		return path.join(config.output, path.dirname(file), `${path.basename(file, path.extname(file)) }.${ext}`);
	};
	const relative = function(file) {
		const to = path.dirname(path.resolve(file));
		const from = path.dirname(path.resolve(destination(source)));
		return path.join(path.relative(from, to), path.basename(file));
	};
	// The **title** of the file is either the first heading in the prose, or the
	// name of the source file.
	const firstSection = underscore.find(sections, function(section) {
		return section.docsText && section.docsText.length > 0;
	});
	const first = firstSection ? marked.lexer(firstSection.docsText)[0] : {};
	const hasTitle = first.type === "heading" && first.depth === 1;
	const title = hasTitle ? first.text : path.basename(source);
	const css = relative(path.join(config.output, path.basename(config.css)));
	const language = getLanguage(source, config);
	const sources = config.sources;

	const html = config.template({
		css,
		destination,
		hasTitle,
		language,
		path,
		relative,
		sections,
		sources,
		title
	});

	if (config.verbose) {
		global.console.log(`docco: ${source} -> ${destination(source)}`);
	}
	return fs.outputFileSync(destination(source), html);
};

export default write;
