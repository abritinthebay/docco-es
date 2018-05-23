/* global jest, it, describe, expect */
import mockConsole from "jest-mock-console";
import commander from "commander";
import toBeType from "jest-tobetype";
expect.extend(toBeType);

const dummyLanguages = {
	// The first two are for languages parsing (markdown is a special case)
	".js": {"name": "javascript", "symbol": "//"},
	".md": {"name": "markdown", "symbol": "//"},
	// This is for the cli tests (as we load files, but is fine for languages parsing)
	"version": "foo"
};
const readFileMock = (...args) => {
	if (args[0] === "foo.jst") {
		// We're in the template call in Configure, so we throw to test.
		throw new Error("nope");
	}
	return JSON.stringify(dummyLanguages);
};

jest.mock("fs-extra");
const fs = require("fs-extra");
fs.readFileSync.mockImplementation(readFileMock);
fs.existsSync.mockReturnValue(true); // for configure

jest.mock("marked");
const marked = require("marked");

jest.mock("highlight.js");
const highlight = require("highlight.js");

const docco = require("../lib/docco");
const cli = require("../lib/cli");
const configure = require("../lib/configure");
const format = require("../lib/format");
const parse = require("../lib/parse");
const languages = require("../lib/languages");
const write = require("../lib/write");

describe("Public API", () => {
	it("is defined correctly", () => {
		expect(Object.keys(docco.default)).toEqual(expect.arrayContaining([
			"document",
			"format",
			"parse",
			"cli",
			"version"
		]));
		expect(typeof docco.document).toBe("function");
		expect(typeof docco.format).toBe("function");
		expect(typeof docco.parse).toBe("function");
		expect(typeof docco.cli).toBe("function");
		expect(typeof docco.version).toBe("string");
		expect(docco.document).toEqual(docco.default.document);
		expect(docco.format).toEqual(docco.default.format);
		expect(docco.parse).toEqual(docco.default.parse);
		expect(docco.cli).toEqual(docco.default.cli);
		expect(docco.version).toEqual(docco.default.version);
	});
});

describe("Configure", () => {
	it("has a default export of the configure function", () => {
		expect(configure.default).toEqual(configure.configure);
	});
	it("implements an Object Pick function", () => {
		const baseObject = {
			a: "foo",
			b: "bar",
			c: "qux",
			d: "qin"
		};
		const output = configure.pick(baseObject, "a", "c");
		expect(typeof configure.pick).toBe("function");
		expect(Object.keys(output)).toHaveLength(2);
		expect(output).toHaveProperty("a", "foo");
		expect(output).toHaveProperty("c", "qux");
	});
	it("returns default configuration", () => {
		const config = configure.configure({});
		expect(config).toMatchObject(expect.objectContaining({
			css: expect.any(String),
			extension: null,
			languages: expect.any(Object),
			layout: expect.any(String),
			marked: null,
			output: expect.any(String),
			template: expect.any(Function),
			throw: false,
			verbose: false,
			public: expect.any(String),
			sources: expect.any(Array),
			zip: null
		}));
	});
	it("correctly sets layout when provided a template", () => {
		const restoreConsole = mockConsole("warn");
		const config = configure.configure({template: "foo.jst"});
		expect(config.layout).toBe(null);
		// expect(global.console.warn).toHaveBeenCalledWith("blaaaa");
		expect(global.console.warn).toHaveBeenCalledTimes(2);
		expect(global.console.warn).toHaveBeenCalledWith("docco: have a template but no stylesheet file specified.");
		expect(global.console.warn).toHaveBeenCalledWith("docco: could not load layout template \"foo.jst\"");
		restoreConsole();
	});
});

describe("Format", () => {
	it("exports expected api", () => {
		expect(format.format).toEqual(format.default);
	});
	it("runs without erroring", () => {
		expect(format.format).not.toThrow();
		const result = format.format();
		expect(result).toBeType("array");
		expect(result.length).toBe(0);
	});
	it("processes sections correctly", () => {
		marked.mockImplementationOnce((text) => `<p>${text}</p>`);
		const sections = [
			{codeText: "foo", docsText: "bar"}
		];
		const result = format.format("test.js", sections);
		expect(result).toBeType("array");
		expect(result.length).toBe(1);
		expect(result[0]).toMatchObject({
			codeText: "foo",
			docsText: "bar",
			codeHtml: "<div class=\"highlight\"><pre>foo</pre></div>",
			docsHtml: "<p>bar</p>"
		});
		marked.mockClear();
	});
	it("handles exceptions correctly", () => {
		highlight.highlight.mockImplementationOnce(() => {
			throw new Error("splode");
		});
		marked.mockImplementation((text) => `<p>${text}</p>`);
		const sections = [
			{codeText: "foo", docsText: "bar"}
		];
		expect(() => format.format("test.js", sections)).not.toThrow();
		const result = format.format("test.js", sections);
		expect(result).toBeType("array");
		expect(result.length).toBe(1);

		highlight.highlight.mockImplementationOnce(() => {
			throw new Error("splode");
		});
		expect(() => format.format("test.js", sections, {throw: true})).toThrow();

		marked.mockClear();
		highlight.highlight.mockClear();
	});
	it("sets markdown highlighter correctly", () => {
		const restoreConsole = mockConsole("warn");
		let options, result;
		marked.setOptions.mockImplementation((opts) => {
			options = opts;
		});
		const sections = [
			{codeText: "foo", docsText: "bar"}
		];

		highlight.getLanguage.mockImplementationOnce(() => {
			return false;
		});

		format.format("test.js", sections);
		expect(options).toBeType("object");
		expect(options.highlight).toBeType("function");

		result = options.highlight("foo");
		expect(result).toBe("foo");
		expect(global.console.warn).toHaveBeenCalledTimes(1);
		global.console.warn.mockClear();
		highlight.highlight.mockClear();
		highlight.getLanguage.mockClear();

		highlight.getLanguage.mockImplementationOnce(() => {
			return true;
		});
		highlight.highlight.mockImplementation((_lang, _code) => {
			return {value: "bar"};
		});
		format.format("test.js", sections);
		expect(options).toBeType("object");
		expect(options.highlight).toBeType("function");

		result = options.highlight("foo");
		expect(result).toBe("bar");
		expect(global.console.warn).not.toHaveBeenCalled();

		highlight.highlight.mockClear();
		highlight.getLanguage.mockClear();
		restoreConsole();
	});
});

describe("Parse", () => {
	it("has the correct default export", () => {
		expect(parse.parse).toEqual(parse.default);
	});
});

describe("CLI", () => {
	it("has the correct default export", () => {
		expect(cli.cli).toEqual(cli.default);
	});
	it("logs output correctly for no arguments", () => {
		const restoreConsole = mockConsole();
		commander.args = [];
		cli.cli();
		expect(global.console.log).toHaveBeenCalledTimes(2);
		expect(commander.version).toHaveBeenCalledTimes(1);
		expect(commander.usage).toHaveBeenCalledTimes(1);
		expect(commander.parse).toHaveBeenCalledTimes(1);
		expect(commander.option).toHaveBeenCalledTimes(11);
		expect(commander.helpInformation).toHaveBeenCalledTimes(1);
		commander.clearMocks();
		restoreConsole();
	});
	it("calls the provided generate function when called with arguments", () => {
		const restoreConsole = mockConsole();
		const test = jest.fn();
		commander.args = ["dummy", "data"];
		cli.cli(commander.args, test);
		expect(global.console.log).toHaveBeenCalledTimes(1);
		expect(test).toHaveBeenCalledTimes(1);
		expect(commander.version).toHaveBeenCalledTimes(1);
		expect(commander.usage).toHaveBeenCalledTimes(1);
		expect(commander.parse).toHaveBeenCalledTimes(1);
		expect(commander.option).toHaveBeenCalledTimes(11);
		expect(commander.helpInformation).not.toHaveBeenCalled();
		commander.clearMocks();
		restoreConsole();
	});
	it("can read a languages file", () => {
		fs.readFileSync.mockClear();
		cli.readLanguages("foo.json");
		expect(fs.readFileSync).toHaveBeenCalledTimes(1);
	});
});

describe("Languages", () => {
	it("has the correct exports", () => {
		expect(languages.default).toBeUndefined();
		expect(languages.languages).toBeDefined();
		expect(languages.languages).toBeType("object");
		expect(languages.getLanguage).toBeDefined();
		expect(languages.getLanguage).toBeType("function");
	});
	it("can get a language based on extension", () => {
		const lang = languages.getLanguage("foo.js");
		expect(lang).toBeType("object");
		expect(lang.name).toBe("javascript");
		expect(lang).toMatchObject({
			name: expect.any(String),
			symbol: expect.any(String),
			commentMatcher: expect.any(RegExp),
			commentFilter: expect.any(RegExp)
		});
	});
	it("can be passed a custom language config", () => {
		const lang = languages.getLanguage("foo.bar", {
			languages: {
				".bar": {"name": "qux"}
			}
		});
		expect(lang.name).toBe("qux");
	});
	it("can detect literate versions of code correctly", () => {
		let lang = languages.getLanguage("foo.js.md", {
			languages: dummyLanguages
		});
		expect(lang.name).toBe("javascript");
		expect(lang.literate).toBe(true);
		lang = languages.getLanguage("foo.md", {
			languages: dummyLanguages
		});
		expect(lang.name).toBe("markdown");
		expect(lang.literate).toBeUndefined();
	});
});

describe("Write", () => {
	it("is defined correctly", () => {
		expect(write.write).toEqual(write.default);
		expect(write).toMatchObject({
			write: expect.any(Function),
			destinationFactory: expect.any(Function),
			relativeFactory: expect.any(Function),
			sectionTest: expect.any(Function)
		});
	});
	it("returns functions from Factories", () => {
		expect(write.destinationFactory()).toBeType("function");
		expect(write.relativeFactory()).toBeType("function");
	});
	it("can get the destination from source file", () => {
		const foo = write.destinationFactory("bar.js", {output: "foo", languages: dummyLanguages});
		expect(foo("bar.js")).toBe("foo/bar.html");
		const bar = write.destinationFactory("qux.md", {output: "foo", languages: dummyLanguages});
		expect(bar("qux.md")).toBe("foo/qux.md");
	});
	it("can get the relative info from source file", () => {
		const bar = write.destinationFactory("bar.js", {output: "foo", languages: dummyLanguages});
		const foo = write.relativeFactory("bar.js", bar);
		expect(foo("bar.js")).toBe("../bar.js");
	});
	it("can check a section for validity", () => {
		expect(write.sectionTest("foo")).toBe(false);
		expect(write.sectionTest({})).toBe(false);
		expect(write.sectionTest({docsText: ""})).toBe(false);
		expect(write.sectionTest({docsText: "something"})).toBe(true);
	});
	it("produces no output when no template is present", () => {
		const restoreConsole = mockConsole("log");
		const config = {
			output: "foo",
			languages: dummyLanguages
		};
		write.write("bar.js", [{}], config);
		expect(global.console.log).toHaveBeenCalledTimes(0);
		expect(fs.outputFileSync).toHaveBeenCalledTimes(0);
		restoreConsole();
	});
	it("produces basic output", () => {
		const restoreConsole = mockConsole("log");
		const config = {
			output: "foo",
			languages: dummyLanguages,
			template: jest.fn().mockImplementation(() => {
				return "dummy output";
			})
		};
		write.write("bar.js", [{}], config);
		expect(global.console.log).toHaveBeenCalledTimes(0);
		expect(config.template).toHaveBeenCalledTimes(1);
		expect(fs.outputFileSync).toHaveBeenCalledTimes(1);
		restoreConsole();
		fs.outputFileSync.mockClear();
	});
	it("produces no output when dryrun is set", () => {
		const restoreConsole = mockConsole("log");
		const config = {
			output: "foo",
			languages: dummyLanguages,
			template: jest.fn().mockImplementation(() => {
				return "dummy output";
			}),
			dryrun: true
		};
		write.write("bar.js", [{}], config);
		expect(global.console.log).toHaveBeenCalledTimes(0);
		expect(config.template).toHaveBeenCalledTimes(1);
		expect(fs.outputFileSync).toHaveBeenCalledTimes(0);
		restoreConsole();
		fs.outputFileSync.mockClear();
	});
	it("logs debug data when verbose is set", () => {
		const restoreConsole = mockConsole("log");
		const config = {
			output: "foo",
			languages: dummyLanguages,
			template: jest.fn().mockImplementation(() => {
				return "dummy output";
			}),
			verbose: true
		};
		write.write("bar.js", [{}], config);
		expect(global.console.log).toHaveBeenCalledTimes(1);
		expect(config.template).toHaveBeenCalledTimes(1);
		expect(fs.outputFileSync).toHaveBeenCalledTimes(1);
		restoreConsole();
		fs.outputFileSync.mockClear();
	});
	it("processes with markdown if section text present", () => {
		const restoreConsole = mockConsole("log");
		marked.lexer.mockImplementationOnce((text) => {
			return [{depth: 1, text}];
		});
		const config = {
			output: "foo",
			languages: dummyLanguages,
			template: jest.fn().mockImplementation(() => {
				return "dummy output";
			})
		};
		write.write("bar.js", [{docsText: "foo"}], config);
		const lastTemplateCallArgs = config.template.mock.calls[config.template.mock.calls.length - 1];

		expect(global.console.log).toHaveBeenCalledTimes(0);
		expect(config.template).toHaveBeenCalledTimes(1);
		expect(lastTemplateCallArgs[0]).toMatchObject({hasTitle: false});
		expect(fs.outputFileSync).toHaveBeenCalledTimes(1);
		expect(marked.lexer).toHaveBeenCalledTimes(1);

		marked.lexer.mockClear();
		config.template.mockClear();
		fs.outputFileSync.mockClear();
		restoreConsole();
	});
	it("processes markdown and sets a title correctly", () => {
		const restoreConsole = mockConsole("log");
		marked.lexer.mockImplementationOnce((text) => {
			return [{depth: 1, type: "heading", text}];
		});
		const config = {
			output: "foo",
			languages: dummyLanguages,
			template: jest.fn().mockImplementation(() => {
				return "dummy output";
			})
		};
		write.write("bar.js", [{docsText: "foo"}], config);
		const lastTemplateCallArgs = config.template.mock.calls[config.template.mock.calls.length - 1];

		expect(global.console.log).toHaveBeenCalledTimes(0);
		expect(config.template).toHaveBeenCalledTimes(1);
		expect(lastTemplateCallArgs[0]).toMatchObject({hasTitle: true, title: "foo"});
		expect(fs.outputFileSync).toHaveBeenCalledTimes(1);
		expect(marked.lexer).toHaveBeenCalledTimes(1);

		marked.lexer.mockClear();
		config.template.mockClear();
		fs.outputFileSync.mockClear();
		restoreConsole();
	});
	it("uses css if present", () => {
		const config = {
			output: "foo",
			languages: dummyLanguages,
			template: jest.fn().mockImplementation(() => {
				return "dummy output";
			}),
			css: "foo.css"
		};
		marked.lexer.mockImplementationOnce((text) => {
			return [{depth: 1, type: "heading", text}];
		});
		write.write("bar.js", [{docsText: "foo"}], config);

		const lastTemplateCallArgs = config.template.mock.calls[config.template.mock.calls.length - 1];
		expect(lastTemplateCallArgs[0]).toMatchObject({css: "foo.css"});
	});
	it("uses styles if present", () => {
		const config = {
			output: "foo",
			languages: dummyLanguages,
			template: jest.fn().mockImplementation(() => {
				return "dummy output";
			}),
			styles: "bar"
		};
		marked.lexer.mockImplementationOnce((text) => {
			return [{depth: 1, type: "heading", text}];
		});
		write.write("bar.js", [{docsText: "foo"}], config);

		const lastTemplateCallArgs = config.template.mock.calls[config.template.mock.calls.length - 1];
		expect(lastTemplateCallArgs[0]).toMatchObject({styles: "bar"});
	});
});
