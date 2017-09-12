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
		"user.created"() {},
		"$local-event"() {}
	}
});

broker.start().then(() => REPL(broker));
