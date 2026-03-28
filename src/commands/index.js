"use strict";

const glob = require("fast-glob");

/**
 * Command option declarations
 * @param {import("commander").Command} program Commander
 * @param {import("moleculer").ServiceBroker} broker Moleculer's Service Broker
 */
module.exports = function (program, broker) {
	const files = glob.sync("*.js", { cwd: __dirname, absolute: true, ignore: ["index.js"] });
	files.sort();
	for (const file of files) {
		const { register } = require(file);
		register(program, broker);
	}
};
