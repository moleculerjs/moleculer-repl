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
			const payload = convertArgs(args.options);
			console.log(kleur.yellow().bold(`>> Emit '${args.eventName}' with payload:`), payload);
			broker.emit(args.eventName, payload);
			done();
		});
};
