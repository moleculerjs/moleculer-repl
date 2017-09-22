"use strict";

let { ServiceBroker } 	= require("moleculer");
let REPL 				= require("../../src");

// Create broker
let broker = new ServiceBroker({
	nodeID: "repl-" + process.pid,
	transporter: "NATS",
	logger: console
});

broker.createService({
	name: "greeter",
	actions: {
		hello(ctx) {
			return "Hello " + ctx.params.name;
		}
	},
	events: {
		"user.created"(payload) {
			this.logger.info("User created even received!", payload);
		},
		"$local-event"(payload) {
			this.logger.info("Local event received!", payload);
		}
	}
});

broker.start().then(() => REPL(broker));
