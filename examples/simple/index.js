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
	name: "test",
	actions: {
		hello() {
			return "Hello";
		}
	}
});

broker.start().then(() => REPL(broker));
