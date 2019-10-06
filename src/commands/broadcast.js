"use strict";

const kleur 			= require("kleur");
const { convertArgs } 	= require("../utils");

module.exports = function(vorpal, broker) {
	// Register broker.broadcast
	vorpal
		.removeIfExist("broadcast")
		.command("broadcast <eventName>", "Broadcast an event")
		.allowUnknownOptions()
		.action((args, done) => {
			const payload = convertArgs(args.options);
			console.log(kleur.yellow().bold(`>> Broadcast '${args.eventName}' with payload:`), payload);
			broker.broadcast(args.eventName, payload);
			done();
		});

	// Register broker.broadcast
	vorpal
		.removeIfExist("broadcastLocal")
		.command("broadcastLocal <eventName>", "Broadcast an event locally")
		.allowUnknownOptions()
		.action((args, done) => {
			const payload = convertArgs(args.options);
			console.log(kleur.yellow().bold(`>> Broadcast '${args.eventName}' locally with payload:`), payload);
			broker.broadcastLocal(args.eventName, payload);
			done();
		});
};
