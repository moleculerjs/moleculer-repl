"use strict";

const glob = require("glob");
const path = require("path");

/**
 * Command option declarations
 * @param {import("commander").Command} program Commander
 * @param {import("moleculer").ServiceBroker} broker Moleculer's Service Broker
 */
module.exports = function (program, broker) {
	const files = glob.sync(path.join(__dirname, "*.js"));
	files.sort();
	files.forEach((file) => {
		if (path.basename(file) != "index.js") {
			const { register } = require(file);
			register(program, broker);
		}
	});
};
