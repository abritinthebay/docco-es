/* global jest, it, describe, expect */
import mockConsole from "jest-mock-console";
import commander from "commander";
import toBeType from "jest-tobetype";
expect.extend(toBeType);

jest.mock("fs");
const fs = require("fs");
fs.readFileSync.mockImplementation((...args) => {
	if (args[0] === "foo.jst") {
		// it's the template call in configure, so we throw.
		throw new Error("nope");
	}
	return JSON.stringify({
		".js": {"name": "javascript", "symbol": "//"}, // for languages file
		"version": "foo" // for the cli (but works with languages file)
	});
});
fs.existsSync.mockReturnValue(true); // for configure

const docco = require("../lib/docco");
const cli = require("../lib/cli");
const configure = require("../lib/configure");
const format = require("../lib/format");
const parse = require("../lib/parse");
const languages = require("../lib/languages");

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

describe("", () => {
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
		let lang = languages.getLanguage("foo.bar.md", {
			languages: {
				".bar": {"name": "qux"},
				".md": {"name": "markdown"}
			}
		});
		expect(lang.name).toBe("qux");
		expect(lang.literate).toBe(true);
		lang = languages.getLanguage("foo.md", {
			languages: {
				".bar": {"name": "qux"},
				".md": {"name": "markdown"}
			}
		});
		expect(lang.name).toBe("markdown");
		expect(lang.literate).toBeUndefined();
	});

});
