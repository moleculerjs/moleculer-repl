"use strict";

const chalk 			= require("chalk");
const { convertArgs } 	= require("../utils");

module.exports = function(vorpal, broker) {
	// Register broker.broadcast
	vorpal
		.command("broadcast <eventName>", "Broadcast an event")
		.allowUnknownOptions()
		.action((args, done) => {
			const payload = convertArgs(args.options);
			console.log(chalk.yellow.bold(`>> Broadcast '${args.eventName}' with payload:`), payload);
			broker.broadcast(args.eventName, payload);
			done();
		});

	// Register broker.broadcast
	vorpal
		.command("broadcastLocal <eventName>", "Broadcast an event locally")
		.allowUnknownOptions()
		.action((args, done) => {
			const payload = convertArgs(args.options);
			console.log(chalk.yellow.bold(`>> Broadcast '${args.eventName}' locally with payload:`), payload);
			broker.broadcastLocal(args.eventName, payload);
			done();
		});
};