"use strict";

const { parser } = require("../args-parser");
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
 * @param {Function} cmdCacheKeysHandler Handler that shows the keys
 * @param {Function} cmdCacheClearHandler Handler that clears the cache
 */
function declaration(
	program,
	broker,
	cmdCacheKeysHandler,
	cmdCacheClearHandler
) {
	const cacheCMD = program.command("cache").description("Manage cache");

	// Register cache keys subcommand
	cacheCMD
		.command("keys")
		.description("List keys of cache entries")
		.option("-f, --filter <match>", "filter keys")
		.allowUnknownOption(true)
		.allowExcessArguments(true)
		.hook("preAction", (thisCommand) => {
			let parsedArgs = {
				...thisCommand._optionValues, // Contains flag values
			};

			const rawCommand = thisCommand.parent.parent.rawArgs
				.slice(2)
				.join(" ");

			// Set the params
			thisCommand.params = {
				options: parsedArgs,
				rawCommand,
			};

			// Clear the parsed values for next execution
			thisCommand._optionValues = {};
		})
		.action(async function () {
			// Get the params
			await cmdCacheKeysHandler(broker, this.params);
		});

	// Register cache clear subcommand
	cacheCMD
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

			const rawCommand = thisCommand.parent.parent.rawArgs
				.slice(2)
				.join(" ");

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
			await cmdCacheClearHandler(broker, this.params);
		});
}

/**
 * Register the command
 *
 * @param {import("commander").Command} program Commander
 * @param {import("moleculer").ServiceBroker} broker Moleculer's Service Broker
 */
function register(program, broker) {
	declaration(program, broker, cacheKeysHandler, cacheClearHandler);
}

module.exports = { register, declaration, cacheKeysHandler, cacheClearHandler };
