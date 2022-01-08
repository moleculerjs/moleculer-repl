"use strict";

const _ 		= require("lodash");

function convertArgs(args) {
	let res = {};
	_.forIn(args, (value, key) => {
		if (key.endsWith("[]")) {
			if (!Array.isArray(value)) value = [value];
			key = key.slice(0, -2);
		}

		if (Array.isArray(value))
			res[key] = value;
		else if (typeof(value) == "object")
			res[key] = convertArgs(value);
		else if (value === "true")
			res[key] = true;
		else if (value === "false")
			res[key] = false;
		else
			res[key] = value;
	});
	return res;
}

const RegexCache = new Map();

/**
 * String matcher to handle dot-separated event/action names.
 *
 * @param {String} text
 * @param {String} pattern
 * @returns {Boolean}
 */
function match(text, pattern) {
	// Simple patterns
	if (pattern.indexOf("?") == -1) {

		// Exact match (eg. "prefix.event")
		const firstStarPosition = pattern.indexOf("*");
		if (firstStarPosition == -1) {
			return pattern === text;
		}

		// Eg. "prefix**"
		const len = pattern.length;
		if (len > 2 && pattern.endsWith("**") && firstStarPosition > len - 3) {
			pattern = pattern.substring(0, len - 2);
			return text.startsWith(pattern);
		}

		// Eg. "prefix*"
		if (len > 1 && pattern.endsWith("*") && firstStarPosition > len - 2) {
			pattern = pattern.substring(0, len - 1);
			if (text.startsWith(pattern)) {
				return text.indexOf(".", len) == -1;
			}
			return false;
		}

		// Accept simple text, without point character (*)
		if (len == 1 && firstStarPosition == 0) {
			return text.indexOf(".") == -1;
		}

		// Accept all inputs (**)
		if (len == 2 && firstStarPosition == 0 && pattern.lastIndexOf("*") == 1) {
			return true;
		}
	}

	// Regex (eg. "prefix.ab?cd.*.foo")
	const origPattern = pattern;
	let regex = RegexCache.get(origPattern);
	if (regex == null) {
		if (pattern.startsWith("$")) {
			pattern = "\\" + pattern;
		}
		pattern = pattern.replace(/\?/g, ".");
		pattern = pattern.replace(/\*\*/g, "§§§");
		pattern = pattern.replace(/\*/g, "[^\\.]*");
		pattern = pattern.replace(/§§§/g, ".*");

		pattern = "^" + pattern + "$";

		// eslint-disable-next-line security/detect-non-literal-regexp
		regex = new RegExp(pattern, "");
		RegexCache.set(origPattern, regex);
	}
	return regex.test(text);
}

// Credits: https://github.com/sindresorhus/is-stream
const isStream = stream =>
	stream !== null &&
	typeof stream === "object" &&
	typeof stream.pipe === "function";

isStream.writable = stream =>
	isStream(stream) &&
	stream.writable !== false &&
	typeof stream._write === "function" &&
	typeof stream._writableState === "object";

isStream.readable = stream =>
	isStream(stream) &&
	stream.readable !== false &&
	typeof stream._read === "function" &&
	typeof stream._readableState === "object";

isStream.duplex = stream =>
	isStream.writable(stream) &&
	isStream.readable(stream);

isStream.transform = stream =>
	isStream.duplex(stream) &&
	typeof stream._transform === "function";

module.exports = {
	formatNumber(value, decimals = 0, sign = false) {
		let res = Number(value.toFixed(decimals)).toLocaleString();
		if (sign && value > 0.0)
			res = "+" + res;
		return res;
	},

	convertArgs,
	match,

	isStream,

	CIRCUIT_CLOSE: "close",
	CIRCUIT_HALF_OPEN: "half_open",
	CIRCUIT_OPEN: "open",
};
