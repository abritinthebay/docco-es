/* global jest, it, describe, expect */
const docco = require("../lib/docco");
const configure = require("../lib/configure");
const format = require("../lib/format");
const parse = require("../lib/parse");

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
		// console.log(config);
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
			sources: expect.any(Array)
		}));
	});
	it("correctly sets layout when provided a template", () => {
		const warn = global.console.warn;
		global.console.warn = jest.fn();
		const config = configure.configure({template: "foo.jst"});
		expect(config.layout).toBe(null);
		expect(global.console.warn).toHaveBeenCalledTimes(2);
		expect(global.console.warn).toHaveBeenCalledWith("docco: have a template but no stylesheet file specified.");
		expect(global.console.warn).toHaveBeenCalledWith("docco: could not load layout template \"foo.jst\"");
		global.console.warn = warn;
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
