"use strict";

const chalk 			= require("chalk");
const _ 				= require("lodash");
const util 				= require("util");
const { convertArgs } 	= require("../utils");

module.exports = function(vorpal, broker) {
	// Register broker.call
	vorpal
		.command("call <actionName> [jsonParams]", "Call an action")
		.autocomplete({
			data() {
				return _.uniq(broker.registry.getActionList({}).map(item => item.action.name));
			}
		})
		//.option("--json", "JSON string payload")
		.allowUnknownOptions()
		.action((args, done) => {
			let payload;
			//console.log(args);
			if (typeof(args.jsonParams) == "string")
				payload = JSON.parse(args.jsonParams);
			else
				payload = convertArgs(args.options);

			console.log(chalk.yellow.bold(`>> Call '${args.actionName}' with params:`), payload);
			broker.call(args.actionName, payload)
				.then(res => {
					console.log(chalk.yellow.bold(">> Response:"));
					console.log(util.inspect(res, { showHidden: false, depth: 4, colors: true }));
				})
				.catch(err => {
					console.error(chalk.red.bold(">> ERROR:", err.message));
					console.error(chalk.red.bold(err.stack));
					console.error("Data: ", util.inspect(err.data, { showHidden: false, depth: 4, colors: true }));
				})
				.finally(done);
		});

	// Register direct broker.call
	vorpal
		.command("dcall <nodeID> <actionName> [jsonParams]", "Direct call an action")
		.allowUnknownOptions()
		.action((args, done) => {
			let payload;
			//console.log(args);
			if (typeof(args.jsonParams) == "string")
				payload = JSON.parse(args.jsonParams);
			else
				payload = convertArgs(args.options);

			const nodeID = args.nodeID;
			console.log(chalk.yellow.bold(`>> Call '${args.actionName}' on '${nodeID}' with params:`), payload);
			broker.call(args.actionName, payload, { nodeID })
				.then(res => {
					console.log(chalk.yellow.bold(">> Response:"));
					console.log(util.inspect(res, { showHidden: false, depth: 4, colors: true }));
				})
				.catch(err => {
					console.error(chalk.red.bold(">> ERROR:", err.message));
					console.error(chalk.red.bold(err.stack));
					console.error("Data: ", util.inspect(err.data, { showHidden: false, depth: 4, colors: true }));
				})
				.finally(done);
		});
};