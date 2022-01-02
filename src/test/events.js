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
async function handler(broker, args) {
	const events = broker.registry.getEventList({
		onlyLocal: args.options.local,
		onlyAvailable: !args.options.all,
		skipInternal: args.options.skipinternal,
		withEndpoints: args.options.details,
	});
	const data = [
		[
			kleur.bold("Event"),
			kleur.bold("Group"),
			kleur.bold("State"),
			kleur.bold("Nodes"),
		],
	];

	events.sort((a, b) => a.name.localeCompare(b.name));

	let hLines = [];

	events.forEach((item) => {
		const event = item.event;

		if (args.options.filter && !match(item.name, args.options.filter))
			return;

		if (event) {
			data.push([
				event.name,
				item.group,
				item.available
					? kleur.bgGreen().white("   OK   ")
					: kleur.bgRed().white().bold(" FAILED "),
				(item.hasLocal ? "(*) " : "") + item.count,
			]);
		} else {
			data.push([
				item.name,
				item.group,
				item.available
					? kleur.bgGreen().white("   OK   ")
					: kleur.bgRed().white().bold(" FAILED "),
				item.count,
			]);
		}

		if (args.options.details && item.endpoints) {
			item.endpoints.forEach((endpoint) => {
				data.push([
					"",
					"",
					endpoint.available
						? kleur.bgGreen().white("   OK   ")
						: kleur.bgRed().white().bold(" FAILED "),
					endpoint.nodeID == broker.nodeID
						? kleur.gray("<local>")
						: endpoint.nodeID,
				]);
			});
			hLines.push(data.length);
		}
	});

	const tableConf = {
		border: _.mapValues(getBorderCharacters("honeywell"), (char) =>
			kleur.gray(char)
		),
		columns: {
			1: { alignment: "right" },
		},
		drawHorizontalLine: (index, count) =>
			index == 0 ||
			index == 1 ||
			index == count ||
			hLines.indexOf(index) !== -1,
	};

	console.log(table(data, tableConf));
}

/**
 * Command option declarations
 * @param {import("commander").Command} program Commander
 * @param {import("moleculer").ServiceBroker} broker Moleculer's Service Broker
 */
function declaration(program, broker) {
	program
		.command("events")
		.description("List of event listeners")
		.option("-a, --all", "list all (offline) event listeners")
		.option("-d, --details", "print endpoints")
		.option(
			"-f, --filter <match>",
			"filter event listeners (e.g.: 'user.*')"
		)
		.option("-i, --skipinternal", "skip internal event listeners")
		.option("-l, --local", "only local event listeners")
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