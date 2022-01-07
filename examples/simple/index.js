"use strict";

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
			],
			types: {
				string: ["name"],
				boolean: ["u", "uppercase"],
			},
			//validate(args) {},
			//help(args) {},
			allowUnknownOptions: true,
			parse(thisCommand) {
				/** @type {import('commander').ParseOptionsResult} */
				const parsedOpts = thisCommand.parseOptions(thisCommand.args);
				// Get command values declared in command field
				const [name] = parsedOpts.operands;

				let parsedArgs = {
					// "this" is the parser method. See args-parser.js in source code
					...this(parsedOpts.unknown),
					...thisCommand._optionValues, // Contains flag values
				};

				const rawCommand = thisCommand.parent.rawArgs
					.slice(2)
					.join(" ");

				// Set the params
				thisCommand.params = {
					options: parsedArgs,
					name,
					rawCommand,
				};

				// Clear the parsed values for next execution
				thisCommand._optionValues = {};
			},
			action(broker, args /*, helpers*/) {
				const name = args.options.uppercase
					? args.name.toUpperCase()
					: args.name;
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
		silent(ctx) {
			return;
		},
		echo(ctx) {
			return {
				params: ctx.params,
				meta: ctx.meta,
			};
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
