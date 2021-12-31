"use strict";

const parse = require("yargs-parser");
const util = require("util");

/**
 * Command logic
 * @param {import("moleculer").ServiceBroker} broker Moleculer's Service Broker
 * @param {Object} args Parsed arguments
 */
async function handler(broker, args) {
	console.log(
		util.inspect(process.env, { showHidden: false, depth: 4, colors: true })
	);
}

/**
 * Command option declarations
 * @param {import("commander").Command} program Commander
 * @param {import("moleculer").ServiceBroker} broker Moleculer's Service Broker
 */
function declaration(program, broker) {
	program
		.command("env")
		.description("List of environment variables")
		.allowUnknownOption(true)
		.allowExcessArguments(true)
		.action(async function () {
			// Get the params
			await handler(broker, this.params);

			// Clear the parsed values for next execution
			this._optionValues = {};
		});
}

module.exports = { declaration, handler };
