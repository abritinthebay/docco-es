# Docco-ES

	       __
	  ____/ /___  ______________        ___  _____
	 / __  / __ \/ ___/ ___/ __ \______/ _ \/ ___/
	/ /_/ / /_/ / /__/ /__/ /_/ /_____/  __(__  )
	\__,_/\____/\___/\___/\____/      \___/____/
[![npm](https://img.shields.io/npm/v/docco-es.svg?style=for-the-badge)](https://www.npmjs.com/package/docco-es)
[![Coverage Status](https://img.shields.io/coveralls/github/abritinthebay/docco-es.svg?style=for-the-badge)](https://coveralls.io/repos/github/abritinthebay/docco-es)
[![CircleCI](https://img.shields.io/circleci/project/github/abritinthebay/docco-es.svg?style=for-the-badge)]()

## About

Docco-ES is a quick-and-simple documentation generator. Inspired by the concepts of [Literate Programming](https://en.wikipedia.org/wiki/Literate_programming) it allows you to see your code's comments
along side the code as documentation.

This is a modern, updated, JavaScript fork of Jeremy Ashkenas' original Literate CoffeeScript implementation.

For more information, see:

<http://abritinthebay.github.com/docco-es/>

## Installation

	npm install -g docco-es

## Usage

	docco [options] FILES

### Options

* `-h, --help` Output usage information
* `-V, --version` Output the version number
* `-l, --layout [layout]` Choose a built-in layouts (parallel, linear)
* `-c, --css [file]` Use a custom css file
* `-o, --output [path]` Use a custom output path
* `-t, --template [file]` Use a custom .jst template
* `-e, --extension [ext]` Use the given file extension for all inputs
* `-L, --languages [file]` Use a custom languages.json
* `-m, --marked [file]` Use custom marked options
* `-T, --throw` Throw errors if code syntax highlighting fails
* `-v, --verbose` Shows all files as they are proccessed rather than a summary

## Layouts

A layout is composed of a CSS file and a JST file. You can provide both of these to Docco to create your own layouts but Docco-ES ships with three layouts built-in.

* **Linear**, a simple, single column, layout that the documentation linked above uses.
* **Parallel**, a two column layout that shows your comments on the left as a kind of annotation to the code, displayed on the right.
* **Markdown**, a special case in that it allows you to output the code formatted as a [markdown](https://en.wikipedia.org/wiki/Markdown) document. With the code marked up in backticks and the comments as regular text. This is especially useful if you want to convert to another format - like LaTeX or a Literate Programming form of your chosen language. All code blocks are marked up with the language matching the extension of the processed file.
