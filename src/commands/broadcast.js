"use strict";

const parse = require("yargs-parser");
const kleur = require("kleur");
const { convertArgs } = require("../utils");

/**
 * Command logic
 * @param {import("moleculer").ServiceBroker} broker Moleculer's Service Broker
 * @param {Object} args Parsed arguments
 * @param {String} methodName broadcast or broadcastLocal
 */
async function handler(broker, args, methodName, infoString) {
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
		kleur.yellow().bold(`>> Broadcast '${args.eventName}' ${infoString}:`),
		payload
	);
	broker[methodName](args.eventName, payload, { meta });
}

/**
 * Command option declarations
 * @param {import("commander").Command} program Commander
 * @param {import("moleculer").ServiceBroker} broker Moleculer's Service Broker
 * @param {Function} cmdHandler Command handler
 */
function declaration(program, broker, cmdHandler) {
	// Register broadcast
	program
		.command("broadcast <eventName>")
		.description("Broadcast an event")
		.allowUnknownOption(true)
		.allowExcessArguments(true)
		.hook("preAction", (thisCommand) => {
			const parsedOpts = thisCommand.parseOptions(thisCommand.args);
			const [eventName, jsonParams] = parsedOpts.operands;

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
				...(jsonParams !== undefined ? { jsonParams } : undefined),
				rawCommand,
			};

			// Clear the parsed values for next execution
			thisCommand._optionValues = {};
		})
		.action(async function () {
			// Get the params
			await cmdHandler(broker, this.params, "broadcast", "with payload");
		});

	// Register broadcast local
	program
		.command("broadcastLocal <eventName>")
		.description("Broadcast an event locally")
		.allowUnknownOption(true)
		.allowExcessArguments(true)
		.hook("preAction", (thisCommand) => {
			const parsedOpts = thisCommand.parseOptions(thisCommand.args);
			const [eventName, jsonParams] = parsedOpts.operands;

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
				...(jsonParams !== undefined ? { jsonParams } : undefined),
				rawCommand,
			};

			// Clear the parsed values for next execution
			thisCommand._optionValues = {};
		})
		.action(async function () {
			// Get the params
			await cmdHandler(
				broker,
				this.params,
				"broadcastLocal",
				"locally with payload"
			);
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
