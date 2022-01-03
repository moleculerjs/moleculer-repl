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
 * @param {Function} cmdHandler Command handler
 */
function declaration(program, broker, cmdHandler) {
	program
		.command("emit <eventName>")
		.description("Emit an event")
		.allowUnknownOption(true)
		.allowExcessArguments(true)
		.hook("preAction", (thisCommand) => {
			const parsedOpts = thisCommand.parseOptions(thisCommand.args);
			const [eventName] = parsedOpts.operands;

			let parsedArgs = {
				...parse(parsedOpts.unknown), // Other params
				...thisCommand._optionValues, // Contains flag values
			};
			delete parsedArgs._;

			const rawCommand = thisCommand.parent.rawArgs.slice(2).join(" ");

			// Set the params
			thisCommand.params = {
				options: parsedArgs,
				eventName,
				rawCommand,
			};

			// Clear the parsed values for next execution
			thisCommand._optionValues = {};
		})
		.action(async function () {
			// Get the params
			await cmdHandler(broker, this.params);
		});
}

/**
 * Register the command
 *
 * @param {import("commander").Command} program Commander
 * @param {import("moleculer").ServiceBroker} broker Moleculer's Service Broker
 */
function register(program, broker) {
	declaration(program, broker, handler);
}

module.exports = { register, declaration, handler };
