"use strict";

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
	const services = broker.registry.getServiceList({
		onlyLocal: args.options.local,
		onlyAvailable: !args.options.all,
		skipInternal: args.options.skipinternal,
		withActions: true,
		withEvents: true,
	});

	const data = [
		[
			kleur.bold("Service"),
			kleur.bold("Version"),
			kleur.bold("State"),
			kleur.bold("Actions"),
			kleur.bold("Events"),
			kleur.bold("Nodes"),
		],
	];

	let list = [];
	let hLines = [];

	services.forEach((svc) => {
		let item = list.find(
			(o) => o.name == svc.name && o.version == svc.version
		);
		if (item) {
			item.nodes.push({ nodeID: svc.nodeID, available: svc.available });
			if (!item.available && svc.available)
				item.available = svc.available;
		} else {
			item = _.pick(svc, ["name", "version"]);
			item.nodes = [{ nodeID: svc.nodeID, available: svc.available }];
			item.actionCount = Object.keys(svc.actions).length;
			item.eventCount = Object.keys(svc.events).length;
			item.available = svc.available;
			list.push(item);
		}
	});

	list.sort((a, b) => a.name.localeCompare(b.name));

	list.forEach((item) => {
		const hasLocal = item.nodes.indexOf(broker.nodeID) !== -1;
		const nodeCount = item.nodes.length;
		const fullName =
			item.fullName != null
				? item.fullName
				: (typeof item.version == "number"
						? "v" + item.version
						: item.version) +
				  "." +
				  item.name;

		if (args.options.filter && !match(fullName, args.options.filter))
			return;

		data.push([
			item.name,
			item.version != null ? item.version : "-",
			item.available
				? kleur.bgGreen().white("   OK   ")
				: kleur.bgRed().white().bold(" FAILED "),
			item.actionCount,
			item.eventCount,
			(hasLocal ? "(*) " : "") + nodeCount,
		]);

		if (args.options.details && item.nodes) {
			item.nodes.forEach(({ nodeID, available }) => {
				data.push([
					"",
					"",
					available
						? kleur.bgGreen().white("   OK   ")
						: kleur.bgRed().white().bold(" FAILED "),
					"",
					"",
					nodeID == broker.nodeID ? kleur.gray("<local>") : nodeID,
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
			2: { alignment: "right" },
			3: { alignment: "right" },
			4: { alignment: "right" },
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
		.command("services")
		.description("List of services")
		.option("-a, --all", "list all (offline) services")
		.option("-d, --details", "print endpoints")
		.option("-f, --filter <match>", "filter services (e.g.: 'user*')")
		.option("-i, --skipinternal", "skip internal services")
		.option("-l, --local", "only local services")
		.hook("preAction", (thisCommand) => {
			// Parse the args that commander.js managed to process
			let parsedArgs = { ...thisCommand._optionValues };

			// Set the params
			thisCommand.params = {
				options: parsedArgs,
				rawCommand: thisCommand.args.join(" "),
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
