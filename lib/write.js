import fs from "fs-extra";
import path from "path";
import marked from "marked";

import {getLanguage} from "./languages";

export const destinationFactory = function(source, config) {
	return (file) => {
		const lang = getLanguage(source, config);
		const ext = lang && lang.name === "markdown" ? "md" : "html";
		return path.join(config.output, path.dirname(file), `${path.basename(file, path.extname(file)) }.${ext}`);
	};
};

export const relativeFactory = function(source, destination) {
	return (file) => {
		const to = path.dirname(path.resolve(file));
		const from = path.dirname(path.resolve(destination(source)));
		return path.join(path.relative(from, to), path.basename(file));
	};
};

export const sectionTest = (section) => {
	return typeof section === "object" && !!section.docsText && section.docsText.length > 0;
};

// Once all of the code has finished highlighting, we can **write** the resulting
// documentation file by passing the completed HTML sections into the template,
// and rendering it to the specified output path.
export const write = function(source, sections, config) {
	const destination = destinationFactory(source, config);
	const relative = relativeFactory(source, destination);
	// The **title** of the file is either the first heading in the prose, or the
	// name of the source file.
	const firstSection = sections.find(sectionTest);
	const first = firstSection ? marked.lexer(firstSection.docsText)[0] : {};
	const hasTitle = first.type === "heading" && first.depth === 1;
	const title = hasTitle ? first.text : path.basename(source);
	const css = config.css ? relative(path.join(config.output, path.basename(config.css))) : "";
	const language = getLanguage(source, config);
	const sources = config.sources;
	const styles = config.styles ? config.styles : "";

	// If we have a template function then use it otherwise we'll have no output.
	const output = typeof config.template === "function" ? config.template({
		css,
		destination,
		hasTitle,
		language,
		path,
		relative,
		sections,
		sources,
		styles,
		title
	}) : false;
	if (output) {
		if (config.verbose) {
			global.console.log(`docco: ${source} -> ${destination(source)}`);
		}
		if (!config.dryrun) {
			return fs.outputFileSync(destination(source), output);
		}
	}
	return false;
};

export default write;
