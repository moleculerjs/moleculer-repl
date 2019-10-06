"use strict";

let { ServiceBroker } 	= require("moleculer");
let REPL 				= require("../../src");

// Create broker
let broker = new ServiceBroker({
	nodeID: "repl-" + process.pid,
	transporter: "TCP",
	logger: console,
	cacher: true,
	metrics: true,
	tracing: false,

	middlewares: [
		"Bulkhead",
		function MyFirstMiddleware() {
			return {};
		},
		{
			name: "MySecond"
		}
	],

	errorHandler(err) {
		throw err;
	},

	// Custom REPL command
	replCommands: [
		{
			command: "hello <name>",
			description: "Call the greeter.hello service with name",
			alias: "hi",
			options: [
				{ option: "-u, --uppercase", description: "Uppercase the name" }
			],
			types: {
				string: ["name"],
				boolean: ["u", "uppercase"]
			},
			//parse(command, args) {},
			//validate(args) {},
			//help(args) {},
			allowUnknownOptions: true,
			action(broker, args/*, helpers*/) {
				const name = args.options.uppercase ? args.name.toUpperCase() : args.name;
				return broker.call("greeter.hello", { name }).then(console.log);
			}
		}
	]
});

broker.createService({
	name: "greeter",
	actions: {
		hello: {
			cache: true,
			handler(ctx) {
				return "Hello " + ctx.params.name;
			}
		},
		welcome(ctx) {
			return {
				params: ctx.params,
				welcomedAt: Date.now()
			};
		},
		silent(ctx) {
			return;
		},
		echo(ctx) {
			return {
				params: ctx.params,
				meta: ctx.meta
			};
		}
	},
	events: {
		"user.created"(payload) {
			this.logger.info("User created even received!", payload);
		},
		"order.created": {
			group: "order",
			handler(payload) {
				this.logger.info("User created even received!", payload);
			}
		},
		"$local-event"(payload) {
			this.logger.info("Local event received!", payload);
		}
	}
});


broker.createService({
	name: "math",
	actions: {
		add: {
			params: {
				a: "number",
				b: "number"
			},
			handler(ctx) {
				return Number(ctx.params.a) + Number(ctx.params.b);
			}
		}
	}
});

broker.createService({
	name: "file",
	actions: {
		echo(ctx) {
			return ctx.params;
		}
	}
});

broker.start().then(() => REPL(broker, {
	delimiter: "moleculer λ",
	customCommands: broker.options.replCommands
}));
