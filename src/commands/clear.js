"use strict";

const parse = require("yargs-parser");
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
 */
function declaration(program, broker) {
	// Register cache keys command
	program
		.command("clear [pattern]")
		.description("Clear cache entries")
		.allowUnknownOption(true)
		.allowExcessArguments(true)
		.hook("preAction", (thisCommand) => {
			// Parse the args that commander.js managed to process
			let parsedArgs = { ...thisCommand._optionValues };
			delete parsedArgs._;

			// Set the params
			thisCommand.params = {
				options: parsedArgs,
				rawCommand: thisCommand.args.join(" "),
			};
		})
		.action(async function () {
			// Get the params
			await handler(broker, this.params);

			// Clear the parsed values for next execution
			this._optionValues = {};
		});
}

module.exports = { declaration, handler };
