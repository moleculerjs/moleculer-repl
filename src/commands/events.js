"use strict";

const chalk 			= require("chalk");
const _ 				= require("lodash");
const { table, getBorderCharacters } 	= require("table");
const { match } 		= require("../utils");

module.exports = function(vorpal, broker) {
	// List events
	vorpal
		.command("events", "List of event listeners")
		.option("-a, --all", "list all (offline) event listeners")
		.option("-d, --details", "print endpoints")
		.option("-f, --filter <match>", "filter event listeners (e.g.: 'user.*')")
		.option("-i, --skipinternal", "skip internal event listeners")
		.option("-l, --local", "only local event listeners")
		.action((args, done) => {
			const events = broker.registry.getEventList({ onlyLocal: args.options.local, onlyAvailable: !args.options.all, skipInternal: args.options.skipinternal, withEndpoints: args.options.details });
			const data = [
				[
					chalk.bold("Event"),
					chalk.bold("Group"),
					chalk.bold("State"),
					chalk.bold("Nodes")
				]
			];

			events.sort((a, b) => a.name.localeCompare(b.name));

			let hLines = [];

			events.forEach(item => {
				const event = item.event;

				if (args.options.filter && !match(item.name, args.options.filter))
					return;

				if (event) {
					data.push([
						event.name,
						item.group,
						item.available ? chalk.bgGreen.white( "   OK   ") : chalk.bgRed.white.bold(" FAILED "),
						(item.hasLocal ? "(*) " : "") + item.count
					]);
				} else {
					data.push([
						item.name,
						item.group,
						item.available ? chalk.bgGreen.white( "   OK   ") : chalk.bgRed.white.bold(" FAILED "),
						item.count
					]);
				}

				if (args.options.details && item.endpoints) {
					item.endpoints.forEach(endpoint => {
						data.push([
							"",
							"",
							endpoint.available ? chalk.bgGreen.white( "   OK   ") : chalk.bgRed.white.bold(" FAILED "),
							endpoint.nodeID == broker.nodeID ? chalk.gray("<local>") : endpoint.nodeID,
						]);
					});
					hLines.push(data.length);
				}
			});

			const tableConf = {
				border: _.mapValues(getBorderCharacters("honeywell"), char => chalk.gray(char)),
				columns: {
					1: { alignment: "right" }
				},
				drawHorizontalLine: (index, count) => index == 0 || index == 1 || index == count || hLines.indexOf(index) !== -1
			};

			console.log(table(data, tableConf));
			done();
		});
};
