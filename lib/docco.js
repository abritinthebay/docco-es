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
// Docco-ES is based on the excellent work of Jeremy Ashkenas who wrote the [original Docco](https://github.com/jashkenas/docco)
// in CoffeeScript. This fork was created to add features and to work with modern JS technologies
// and language features that didn't exist when it was original written or that
// CoffeeScript does not support.

// How We Generation Documentation
// -------------------------------
// We generate the documentation for our configured source file(s) by:
// - copying over static assets
// - reading all the source files in
// - splitting them up into prose/code sections
// - highlighting each file in the appropriate language
// - printing them out in a template

// And Now, The Code.
// ------------------

// First require our internal dependencies.
import parse from "./parse";
import format from "./format";
import document from "./document";
import cli from "./cli";
import {version} from "./cli";

// Then export our public API.
export default {
	document,
	format,
	parse,
	cli,
	version
};

// The core function called by the CLI is, unsurprisingly, called `cli`.
// However with the other functions you can programatically use docco.
