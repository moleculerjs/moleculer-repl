"use strict";

const chalk 			= require("chalk");
const { convertArgs } 	= require("../utils");

module.exports = function(vorpal, broker) {
	// Register broker.emit
	vorpal
		.command("emit <eventName>", "Emit an event")
		.allowUnknownOptions()
		.action((args, done) => {
			const payload = convertArgs(args.options);
			console.log(chalk.yellow.bold(`>> Emit '${args.eventName}' with payload:`), payload);
			broker.emit(args.eventName, payload);
			done();
		});
};