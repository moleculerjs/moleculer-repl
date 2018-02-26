"use strict";

const chalk 			= require("chalk");
const _ 				= require("lodash");
const { convertArgs } 	= require("../utils");

module.exports = function(vorpal, broker) {
	// Register broker.emit
	vorpal
		.command("emit <eventName>", "Emit an event")
		.autocomplete({
			data() {
				return _.uniq(broker.registry.getEventList({}).map(item => item.event.name));
			}
		})
		.allowUnknownOptions()
		.action((args, done) => {
			const payload = convertArgs(args.options);
			console.log(chalk.yellow.bold(`>> Emit '${args.eventName}' with payload:`), payload);
			broker.emit(args.eventName, payload);
			done();
		});
};
