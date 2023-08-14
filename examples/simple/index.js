"use strict";

const { Readable } = require("stream");
const { ServiceBroker } = require("moleculer");
const REPL = require("../../src");

// Create broker
const broker = new ServiceBroker({
	nodeID: "repl-" + process.pid,

	// Custom REPL command
	replCommands: [
		{
			command: "hello <name>",
			description: "Call the greeter.hello service with name",
			alias: "hi",
			options: [
				{
					option: "-u, --uppercase",
					description: "Uppercase the name",
				},
				{
					option: "-p, --prefix <prefix>",
					description: "Add prefix to the name",
				},
			],
			types: {
				string: ["name"],
				boolean: ["u", "uppercase"],
			},
			//validate(args) {},
			//help(args) {},
			//allowUnknownOptions: true,
			action(broker, args /*, helpers*/) {
				let name = args.options.uppercase
					? args.name.toUpperCase()
					: args.name;
				if (args.options.prefix) name = args.options.prefix + name;

				return broker.call("greeter.hello", { name }).then(console.log);
			},
		},
	],
});

broker.createService({
	name: "greeter",
	actions: {
		hello: {
			cache: true,
			handler(ctx) {
				return "Hello " + ctx.params.name;
			},
		},
		welcome(ctx) {
			return {
				params: ctx.params,
				welcomedAt: Date.now(),
			};
		},
		silent() {
			return;
		},
		echo(ctx) {
			return {
				params: ctx.params,
				meta: ctx.meta,
			};
		},
		objectStream() {
			return Readable.from(
				[{ hello: "world" }, { peace: "for everyone" }],
				{ objectMode: true }
			);
		},
		binaryStream() {
			return Readable.from([Buffer.from("hello"), Buffer.from("world")], {
				objectMode: false,
			});
		},
	},
	events: {
		"user.created"(ctx) {
			this.logger.info(
				"User created event received!",
				ctx.params,
				ctx.meta
			);
		},
		"user.updated"(ctx) {
			this.logger.info(
				"User updated even received!",
				ctx.params,
				ctx.meta
			);
		},
		"order.created": {
			group: "order",
			params: {
				id: "number",
				amount: "number",
				onlyLocal: { type: "boolean", optional: true },
				skipInternal: { type: "boolean", optional: true },
				withActions: { type: "boolean", optional: true },
				withEvents: { type: "boolean", optional: true },
				onlyAvailable: { type: "boolean", optional: true },
				grouping: { type: "boolean", optional: true },
			},
			handler(payload) {
				this.logger.info("User created even received!", payload);
			},
		},
		"$local-event"(payload) {
			this.logger.info("Local event received!", payload);
		},
	},
});

broker.createService({
	name: "math",
	actions: {
		add: {
			params: {
				a: "number",
				b: "number",
			},
			handler(ctx) {
				return Number(ctx.params.a) + Number(ctx.params.b);
			},
		},
	},
});

broker.createService({
	name: "file",
	actions: {
		echo(ctx) {
			return ctx.params;
		},
	},
});

broker.start().then(() =>
	REPL(broker, {
		delimiter: "moleculer λ",
		customCommands: broker.options.replCommands,
	})
);
