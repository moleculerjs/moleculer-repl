"use strict";

const parse = require("yargs-parser");
const kleur = require("kleur");
const _ = require("lodash");
const { table, getBorderCharacters } = require("table");
const { match } = require("../utils");

/**
 * Command logic
 * @param {import("moleculer").ServiceBroker} broker Moleculer's Service Broker
 * @param {Object} args Parsed arguments
 */
async function cacheKeysHandler(broker, args) {
	if (!broker.cacher) {
		console.log(kleur.red().bold("No cacher."));
		// return done();
		return;
	}

	if (!_.isFunction(broker.cacher.getCacheKeys)) {
		console.log(
			kleur
				.yellow()
				.bold(
					"Cacher is not compatible. Missing 'getCacheKeys' method."
				)
		);
		// return done();
		return;
	}

	broker.cacher
		.getCacheKeys()
		.then((entries) => {
			const data = [
				[
					kleur.bold("Key"),
					//kleur.bold("Expires at"),
				],
			];

			entries.sort((a, b) => a.key.localeCompare(b.key));

			//let hLines = [];

			entries.forEach((item) => {
				if (
					args.options.filter &&
					!match(item.key, args.options.filter)
				)
					return;

				data.push([
					item.key,
					//item.expiresAt
				]);
			});

			const tableConf = {
				border: _.mapValues(getBorderCharacters("honeywell"), (char) =>
					kleur.gray(char)
				),
				columns: {},
				//drawHorizontalLine: (index, count) => index == 0 || index == 1 || index == count || hLines.indexOf(index) !== -1
			};

			console.log(table(data, tableConf));

			// done();
		})
		.catch((err) => {
			console.error(err);
			// done();
		});
}

/**
 * Command logic
 * @param {import("moleculer").ServiceBroker} broker Moleculer's Service Broker
 * @param {Object} args Parsed arguments
 */
async function cacheClearHandler(broker, args) {
	if (broker.cacher) {
		broker.cacher
			.clean(args.pattern)
			.then(() => {
				console.log(
					kleur
						.yellow()
						.bold(
							args.pattern
								? "Cacher cleared entries by pattern."
								: "Cacher cleared all entries."
						)
				);
				// done();
			})
			.catch((err) => {
				console.error(err);
				// done();
			});
		return;
	}

	console.log(kleur.red().bold("No cacher."));
	// done();
}

/**
 * Command option declarations
 * @param {import("commander").Command} program Commander
 * @param {import("moleculer").ServiceBroker} broker Moleculer's Service Broker
 */
function declaration(program, broker) {
	// Register cache keys command
	program
		.command("cache-keys")
		.description("List keys of cache entries")
		.option("-f, --filter <match>", "filter keys")
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
			await cacheKeysHandler(broker, this.params);

			// Clear the parsed values for next execution
			this._optionValues = {};
		});

	// Register cache clear command
	program
		.command("cache-clear [pattern]")
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
			await cacheClearHandler(broker, this.params);

			// Clear the parsed values for next execution
			this._optionValues = {};
		});
}

module.exports = { declaration, cacheKeysHandler, cacheClearHandler };
