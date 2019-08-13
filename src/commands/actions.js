"use strict";

const chalk 							= require("chalk");
const _ 								= require("lodash");
const { table, getBorderCharacters } 	= require("table");

const { match, CIRCUIT_CLOSE, CIRCUIT_HALF_OPEN, CIRCUIT_OPEN } = require("../utils");

module.exports = function(vorpal, broker) {
	// List actions
	vorpal
		.removeIfExist("actions")
		.command("actions", "List of actions")
		.option("-a, --all", "list all (offline) actions")
		.option("-d, --details", "print endpoints")
		.option("-f, --filter <match>", "filter actions (e.g.: 'users.*')")
		.option("-i, --skipinternal", "skip internal actions")
		.option("-l, --local", "only local actions")
		.action((args, done) => {
			const actions = broker.registry.getActionList({ onlyLocal: args.options.local, onlyAvailable: !args.options.all, skipInternal: args.options.skipinternal, withEndpoints: args.options.details });

			const data = [
				[
					chalk.bold("Action"),
					chalk.bold("Nodes"),
					chalk.bold("State"),
					chalk.bold("Cached"),
					chalk.bold("Params")
				]
			];

			let hLines = [];

			actions.sort((a, b) => a.name.localeCompare(b.name));

			let lastServiceName;

			actions.forEach(item => {
				const action = item.action;
				const state = item.available;
				const params = action && action.params ? Object.keys(action.params).join(", ") : "";

				if (args.options.filter && !match(item.name, args.options.filter))
					return;

				const serviceName = item.name.split(".")[0];

				// Draw a separator line
				if (lastServiceName && serviceName != lastServiceName)
					hLines.push(data.length);
				lastServiceName = serviceName;

				if (action) {
					data.push([
						action.name,
						(item.hasLocal ? "(*) " : "") + item.count,
						state ? chalk.bgGreen.white("   OK   "):chalk.bgRed.white.bold(" FAILED "),
						action.cache ? chalk.green("Yes"):chalk.gray("No"),
						params
					]);
				} else {
					data.push([
						item.name,
						item.count,
						chalk.bgRed.white.bold(" FAILED "),
						"",
						""
					]);
				}

				let getStateLabel = (state) => {
					switch(state) {
					case true:
					case CIRCUIT_CLOSE:			return chalk.bgGreen.white( "   OK   ");
					case CIRCUIT_HALF_OPEN: 	return chalk.bgYellow.black(" TRYING ");
					case false:
					case CIRCUIT_OPEN: 			return chalk.bgRed.white(	" FAILED ");
					}
				};

				if (args.options.details && item.endpoints) {
					item.endpoints.forEach(endpoint => {
						data.push([
							"",
							endpoint.nodeID == broker.nodeID ? chalk.gray("<local>") : endpoint.nodeID,
							getStateLabel(endpoint.state),
							"",
							""
						]);
					});
					hLines.push(data.length);
				}
			});

			const tableConf = {
				border: _.mapValues(getBorderCharacters("honeywell"), char => chalk.gray(char)),
				columns: {
					1: { alignment: "right" },
					3: { alignment: "center" },
					5: { width: 20, wrapWord: true }
				},
				drawHorizontalLine: (index, count) => index == 0 || index == 1 || index == count || hLines.indexOf(index) !== -1
			};

			console.log(table(data, tableConf));
			done();
		});
};
