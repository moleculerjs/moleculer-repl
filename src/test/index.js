"use strict";

const glob = require("glob");
const path = require("path");

module.exports = function (commander, broker) {
	const files = glob.sync(path.join(__dirname, "*.js"));
	files.sort();
	files.forEach((file) => {
		if (path.basename(file) != "index.js") require(file)(commander, broker);
	});
};
