"use strict";

const parse = require("yargs-parser");
const kleur = require("kleur");
const _ = require("lodash");
const { convertArgs } = require("../utils");

/**
 * Command logic
 * @param {import("moleculer").ServiceBroker} broker Moleculer's Service Broker
 * @param {Object} args Parsed arguments
 */
async function handler(broker, args) {
	let payload = {};
	let meta = {
		$repl: true,
	};

	const opts = convertArgs(args.options);

	Object.keys(opts).map((key) => {
		if (key.startsWith("#")) meta[key.slice(1)] = opts[key];
		else {
			if (key.startsWith("@")) payload[key.slice(1)] = opts[key];
			else payload[key] = opts[key];
		}
	});

	console.log(
		kleur.yellow().bold(`>> Emit '${args.eventName}' with payload:`),
		payload
	);
	broker.emit(args.eventName, payload, { meta });
}

/**
 * Command option declarations
 * @param {import("commander").Command} program Commander
 * @param {import("moleculer").ServiceBroker} broker Moleculer's Service Broker
 */
function declaration(program, broker) {
	program
		.command("emit <eventName>")
		.description("Emit an event")
		.allowUnknownOption(true)
		.allowExcessArguments(true)
		.hook("preAction", (thisCommand) => {
			const [eventName, ...args] = thisCommand.args;
			// Parse the unknown args + args that commander.js managed to process
			let parsedArgs = { ...parse(args), ...thisCommand._optionValues };
			delete parsedArgs._;

			// Set the params
			thisCommand.params = {
				options: parsedArgs,
				eventName,
				rawCommand: thisCommand.args.join(" "),
			};
		})
		.action(async function () {
			console.log(this.params);

			// Get the params
			await handler(broker, this.params);

			// Clear the parsed values for next execution
			this._optionValues = {};
		});
}

module.exports = { declaration, handler };