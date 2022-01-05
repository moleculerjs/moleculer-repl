"use strict";

const parse = require("yargs-parser");
const kleur = require("kleur");
const _ = require("lodash");
const { table, getBorderCharacters } = require("table");

const {
	match,
	CIRCUIT_CLOSE,
	CIRCUIT_HALF_OPEN,
	CIRCUIT_OPEN,
} = require("../utils");

/**
 * Command logic
 * @param {import("moleculer").ServiceBroker} broker Moleculer's Service Broker
 * @param {Object} args Parsed arguments
 */
async function handler(broker, args) {
	const actions = broker.registry.getActionList({
		onlyLocal: args.options.local,
		onlyAvailable: !args.options.all,
		skipInternal: args.options.skipinternal,
		withEndpoints: args.options.details,
	});

	const data = [
		[
			kleur.bold("Action"),
			kleur.bold("Nodes"),
			kleur.bold("State"),
			kleur.bold("Cached"),
			kleur.bold("Params"),
		],
	];

	let hLines = [];

	actions.sort((a, b) => a.name.localeCompare(b.name));

	let lastServiceName;

	actions.forEach((item) => {
		const action = item.action;
		const state = item.available;
		const params =
			action && action.params
				? Object.keys(action.params).join(", ")
				: "";

		if (args.options.filter && !match(item.name, args.options.filter))
			return;

		const serviceName = item.name.split(".").slice(0, -1).join(".");

		// Draw a separator line
		if (lastServiceName && serviceName != lastServiceName)
			hLines.push(data.length);
		lastServiceName = serviceName;

		if (action) {
			data.push([
				action.name,
				(item.hasLocal ? "(*) " : "") + item.count,
				state
					? kleur.bgGreen().white("   OK   ")
					: kleur.bgRed().white().bold(" FAILED "),
				action.cache ? kleur.green("Yes") : kleur.gray("No"),
				params,
			]);
		} else {
			data.push([
				item.name,
				item.count,
				kleur.bgRed().white().bold(" FAILED "),
				"",
				"",
			]);
		}

		let getStateLabel = (state) => {
			switch (state) {
				case true:
				case CIRCUIT_CLOSE:
					return kleur.bgGreen().white("   OK   ");
				case CIRCUIT_HALF_OPEN:
					return kleur.bgYellow().black(" TRYING ");
				case false:
				case CIRCUIT_OPEN:
					return kleur.bgRed().white(" FAILED ");
			}
		};

		if (args.options.details && item.endpoints) {
			item.endpoints.forEach((endpoint) => {
				data.push([
					"",
					endpoint.nodeID == broker.nodeID
						? kleur.gray("<local>")
						: endpoint.nodeID,
					getStateLabel(endpoint.state),
					"",
					"",
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
			3: { alignment: "center" },
			5: { width: 20, wrapWord: true },
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
 * @param {Function} cmdHandler Command handler
 */
function declaration(program, broker, cmdHandler) {
	program
		.command("actions")
		.description("List of actions")
		.option("-a, --all", "list all (offline) actions")
		.option("-d, --details", "print endpoints")
		.option("-f, --filter <match>", "filter actions (e.g.: 'users.*')")
		.option("-i, --skipinternal", "skip internal actions")
		.option("-l, --local", "only local actions")
		.hook("preAction", (thisCommand) => {
			let parsedArgs = {
				...thisCommand._optionValues, // Contains flag values
			};

			const rawCommand = thisCommand.parent.rawArgs.slice(2).join(" ");

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
