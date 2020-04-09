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
			let payload = {};
			let meta = {
				$repl: true
			};

			const opts = convertArgs(args.options);

			Object.keys(opts).map(key => {
				if (key.startsWith("#"))
					meta[key.slice(1)] = opts[key];
				else {
					if (key.startsWith("@"))
						payload[key.slice(1)] = opts[key];
					else
						payload[key] = opts[key];
				}
			});
			console.log(kleur.yellow().bold(`>> Broadcast '${args.eventName}' with payload:`), payload);
			broker.broadcast(args.eventName, payload, { meta });
			done();
		});

	// Register broker.broadcast
	vorpal
		.removeIfExist("broadcastLocal")
		.command("broadcastLocal <eventName>", "Broadcast an event locally")
		.allowUnknownOptions()
		.action((args, done) => {
			let payload = {};
			let meta = {
				$repl: true
			};

			const opts = convertArgs(args.options);

			Object.keys(opts).map(key => {
				if (key.startsWith("#"))
					meta[key.slice(1)] = opts[key];
				else {
					if (key.startsWith("@"))
						payload[key.slice(1)] = opts[key];
					else
						payload[key] = opts[key];
				}
			});
			console.log(kleur.yellow().bold(`>> Broadcast '${args.eventName}' locally with payload:`), payload);
			broker.broadcastLocal(args.eventName, payload, { meta });
			done();
		});
};
