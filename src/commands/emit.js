"use strict";

const kleur 			= require("kleur");
const _ 				= require("lodash");
const { convertArgs } 	= require("../utils");

module.exports = function(vorpal, broker) {
	// Register broker.emit
	vorpal
		.removeIfExist("emit")
		.command("emit <eventName>", "Emit an event")
		.autocomplete({
			data() {
				return _.uniq(_.compact(broker.registry.getEventList({}).map(item => item && item.event ? item.event.name: null)));
			}
		})
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

			console.log(kleur.yellow().bold(`>> Emit '${args.eventName}' with payload:`), payload);
			broker.emit(args.eventName, payload, { meta });
			done();
		});
};
