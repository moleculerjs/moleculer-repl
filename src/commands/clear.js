"use strict";

const { parser } = require("../args-parser");
const kleur = require("kleur");

/**
 * Command logic
 * @param {import("moleculer").ServiceBroker} broker Moleculer's Service Broker
 * @param {Object} args Parsed arguments
 */
async function handler(broker, args) {
	console.warn(
		kleur
			.yellow()
			.bold(
				"The 'clear' command is deprecated. Use the 'cache clear' instead."
			)
	);

	if (broker.cacher) {
		broker.cacher.clean(args.pattern).then(() => {
			console.log(
				kleur
					.yellow()
					.bold(
						args.pattern
							? "Cacher cleared entries by pattern."
							: "Cacher cleared all entries."
					)
			);
		});
		return;
	}

	console.log(kleur.red().bold("No cacher."));
}

/**
 * Command option declarations
 * @param {import("commander").Command} program Commander
 * @param {import("moleculer").ServiceBroker} broker Moleculer's Service Broker
 * @param {Function} cmdHandler Command handler
 */
function declaration(program, broker, cmdHandler) {
	// Register cache keys command
	program
		.command("clear [pattern]")
		.description("Clear cache entries")
		.allowUnknownOption(true)
		.allowExcessArguments(true)
		.hook("preAction", (thisCommand) => {
			const parsedOpts = thisCommand.parseOptions(thisCommand.args);
			const [pattern] = parsedOpts.operands;

			let parsedArgs = {
				...parser(parsedOpts.unknown), // Other params
				...thisCommand._optionValues, // Contains flag values
			};

			const rawCommand = thisCommand.parent.rawArgs.slice(2).join(" ");

			// Set the params
			thisCommand.params = {
				options: parsedArgs,
				pattern,
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
