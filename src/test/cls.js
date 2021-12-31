"use strict";

const parse = require("yargs-parser");
const kleur = require("kleur");

/**
 * Command logic
 * @param {import("moleculer").ServiceBroker} broker Moleculer's Service Broker
 * @param {Object} args Parsed arguments
 */
async function handler(broker, args) {
	process.stdout.write("\x1Bc");
}

/**
 * Command option declarations
 * @param {import("commander").Command} program Commander
 * @param {import("moleculer").ServiceBroker} broker Moleculer's Service Broker
 */
function declaration(program, broker) {
	program
		.command("cls")
		.description("Clear console")
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
