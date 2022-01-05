const parse = require("yargs-parser");
const { isHex } = require("./flag-processing");

/**
 * Parses a
 * @param {Array<String>} args
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
