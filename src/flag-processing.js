const commander = require("commander");

/**
 * Tries to parse string to integer
 * @param {String} value 
 * @returns {Number}
 */
function flagParseInt(value) {
	// parseInt takes a string and a radix
	const parsedValue = parseInt(value, 10);
	if (isNaN(parsedValue)) {
		throw new commander.InvalidArgumentError("Not a number.");
	}
	return parsedValue;
}

/**
 * Checks if string is a hexadecimal
 * @param {String} x 
 * @returns {Boolean}
 */
function isHex(x) {
	return /^0x[0-9a-f]+$/i.test(x);
}

module.exports = { flagParseInt, isHex };
