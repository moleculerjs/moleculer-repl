"use strict";

const glob = require("glob");
const path = require("path");

module.exports = function(vorpal, broker) {
	const files = glob.sync(path.join(__dirname, "*.js"));
	files.sort();
	files.forEach(file => {
		if (path.basename(file) != "index.js")
			require(file)(vorpal, broker);
	});
};

