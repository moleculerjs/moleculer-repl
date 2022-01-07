const parse = require("yargs-parser");
const { isHex } = require("./flag-processing");

/**
 * Parses array of args into an object with key/values
 *
 * Example:
 *
 * ```js
 * // Input
 * const args = [ "--a", "5", "--b", "Bob", "--c", "--no-d", "--e.f", "hello", "--traceHash", "0x75", "--hash", "0x895", ];
 * // Output
 * const result = {
 * 		a: 5,
 * 		b: 'Bob',
 * 		c: true,
 * 		d: false,
 * 		e: { f: 'hello' },
 * 		traceHash: '0x75',
 * 		hash: '0x895'
 *	}
 *
 * ```
 *
 * @param {Array<String>} args args to parse
 * @returns {Object} parsed args
 */
function parser(args) {
	/** @type {Array<String>} */
	let hexKeys = [];

	args.forEach((entry, index) => {
		if (isHex(entry)) hexKeys.push(args[index - 1]);
	});

	// Remove the dashes
	hexKeys = hexKeys.map((key) => key.replace("--", ""));

	const parsedArgs = parse(args, {
		string: hexKeys, // Tell yargs-parser to keep hexKeys values as string
	});

	delete parsedArgs._;

	return parsedArgs;
}

module.exports = { parser };
