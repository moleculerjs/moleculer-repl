"use strict";

const _ 		= require("lodash");

function convertArgs(args) {
	let res = {};
	_.forIn(args, (value, key) => {
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

module.exports = {
	formatNumber(value, decimals = 0, sign = false) {
		let res = Number(value.toFixed(decimals)).toLocaleString();
		if (sign && value > 0.0)
			res = "+" + res;
		return res;
	},

	convertArgs,

	CIRCUIT_CLOSE: "close",
	CIRCUIT_HALF_OPEN: "half_open",
	CIRCUIT_OPEN: "open",
};