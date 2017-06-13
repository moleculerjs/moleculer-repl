"use strict";

let { ServiceBroker } 	= require("moleculer");
let REPL 				= require("../../src");

// Create broker
let broker = new ServiceBroker({
	logger: console
});

REPL(broker);
