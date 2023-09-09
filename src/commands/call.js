"use strict";

const { parser } = require("../args-parser");
const kleur = require("kleur");
const fs = require("fs");
const path = require("path");
const _ = require("lodash");
const util = require("util");
const { Transform } = require("stream");
const { convertArgs } = require("../utils");
const humanize = require("tiny-human-time").short;
const { isStream } = require("../utils");

/**
 * Command logic
 * @param {import("moleculer").ServiceBroker} broker Moleculer's Service Broker
 * @param {Object} args Parsed arguments
 */
async function handler(broker, args) {
	let payload;
	let meta = {};
	let callOpts = {};
	// console.log(args);
	if (typeof args.jsonParams == "string") {
		try {
			payload = JSON.parse(args.jsonParams);
		} catch (err) {
			console.error(
				kleur.red().bold(">> ERROR:", err.message, args.jsonParams)
			);
			console.error(kleur.red().bold(err.stack));
			return;
		}
	} else {
		payload = {};

		const opts = convertArgs(args.options);
		if (args.options.save) delete opts.save;

		Object.keys(opts).map((key) => {
			if (key.startsWith("#")) meta[key.slice(1)] = opts[key];
			else if (key.startsWith("$")) callOpts[key.slice(1)] = opts[key];
			else {
				if (key.startsWith("@")) payload[key.slice(1)] = opts[key];
				else payload[key] = opts[key];
			}
		});
	}

	if (typeof args.meta === "string") {
		try {
			meta = JSON.parse(args.meta);
		} catch (err) {
			console.error(kleur.red().bold("Can't parse [meta]"), args.meta);
			return;
		}
	}

	// Load payload from file
	if (args.options.load) {
		let fName;
		if (_.isString(args.options.load)) {
			fName = path.resolve(args.options.load);
		} else {
			fName = path.resolve(`${args.actionName}.params.json`);
		}
		if (fs.existsSync(fName)) {
			console.log(kleur.magenta(`>> Load params from '${fName}' file.`));
			payload = JSON.parse(fs.readFileSync(fName, "utf8"));
		} else {
			console.log(kleur.red(">> File not found:", fName));
		}
	}

	// Load payload from file with a { "params" : {...}, "meta": {...}, options {...}} format
	if (args.options.loadFull) {
		let fName;
		if (_.isString(args.options.loadFull)) {
			fName = path.resolve(args.options.loadFull);
		} else {
			fName = path.resolve(`${args.actionName}.params.json`);
		}
		if (fs.existsSync(fName)) {
			console.log(kleur.magenta(`>> Load params from '${fName}' file.`));
			({
				params: payload,
				meta,
				options: callOpts,
			} = JSON.parse(fs.readFileSync(fName, "utf8")));
			console.log(payload);
		} else {
			console.log(kleur.red(">> File not found:", fName));
		}
	}

	// Load payload from file as stream
	if (args.options.stream) {
		let fName;
		if (_.isString(args.options.stream)) {
			fName = path.resolve(args.options.stream);
		} else {
			fName = path.resolve(`${args.actionName}.stream`);
		}
		if (fs.existsSync(fName)) {
			console.log(kleur.magenta(`>> Load stream from '${fName}' file.`));
			payload = fs.createReadStream(fName);
		} else {
			console.log(kleur.red(">> File not found:", fName));
		}
	}

	// Remove non-standard call opts
	[
		{
			key: "local",
			replaceKey: "nodeID",
			value: args.nodeID,
		},
	].forEach((opt) => {
		if (callOpts[opt.key]) {
			delete callOpts[opt.key];
			opt.replaceKey ? (callOpts[opt.replaceKey] = opt.value) : undefined;
		}
	});

	const startTime = process.hrtime();
	const nodeID = args.nodeID;

	if (
		nodeID &&
		!broker.registry
			.getServiceList({})
			.map((service) => service.nodeID)
			.includes(nodeID)
	) {
		console.error(
			kleur.red().bold(`>> Node '${nodeID}' is not available.`)
		);
		return;
	}

	meta.$repl = true;
	console.log(
		kleur
			.yellow()
			.bold(
				`>> Call '${args.actionName}'${nodeID ? " on " + nodeID : ""}`
			),
		isStream(payload)
			? kleur.yellow().bold("with <Stream>.")
			: kleur.yellow().bold("with params:"),
		isStream(payload) ? "" : payload,
		meta ? kleur.yellow().bold("with meta:") : "",
		meta ? meta : "",
		Object.keys(callOpts).length
			? kleur.yellow().bold("with options:")
			: "",
		Object.keys(callOpts).length ? callOpts : ""
	);

	try {
		const res = await broker.call(args.actionName, payload, {
			meta,
			nodeID,
			...callOpts,
		});

		const diff = process.hrtime(startTime);
		const duration = (diff[0] + diff[1] / 1e9) * 1000;
		console.log(
			kleur.cyan().bold(">> Execution time:" + humanize(duration))
		);

		console.log(kleur.yellow().bold(">> Response:"));
		if (isStream(res)) {
			console.log("<Stream>");
		} else {
			console.log(
				util.inspect(res, {
					showHidden: false,
					depth: 4,
					colors: true,
				})
			);
		}

		// Save response to file
		if (args.options.save && res != null) {
			let fName;
			if (_.isString(args.options.save)) {
				fName = path.resolve(args.options.save);
			} else {
				fName = path.join(".", `${args.actionName}.response`);
				if (isStream(res)) fName += ".stream";
				else fName += _.isObject(res) ? ".json" : ".txt";
			}

			if (isStream(res)) {
				const isObjectMode = res.objectMode || res.readableObjectMode;
				const print = args.options.save === "stdout";

				let chunkSeq = 0;

				const pass = new Transform({
					objectMode: isObjectMode || print,
					transform(chunk, _, cb) {
						const value = print
							? isObjectMode
								? JSON.stringify(chunk, null, 4)
								: util.inspect(chunk)
							: isObjectMode
								? Buffer.from(JSON.stringify(chunk, null, 4) + "\n")
								: chunk;

						const message = print
							? `<= Stream chunk is received seq: ${++chunkSeq}\n${value}\n`
							: value;

						cb(null, message);
					},
				});

				const stream = res.pipe(pass);

				if (print) {
					stream.on("data", (value) => console.log(value));
				} else {
					stream.pipe(fs.createWriteStream(fName));
				}

				await new Promise((resolve, reject) => {
					stream
						.on("end", () => {
							resolve();
							const message = print
								? ">> Response has been printed to stdout."
								: `>> Response has been saved to '${fName}' file.`;

							console.log(message);
						})
						.on("error", reject);
				});
			} else {
				fs.writeFileSync(
					fName,
					_.isObject(res) ? JSON.stringify(res, null, 4) : res,
					"utf8"
				);

				console.log(
					kleur
						.magenta()
						.bold(`>> Response has been saved to '${fName}' file.`)
				);
			}
		}
	} catch (err) {
		console.error(kleur.red().bold(">> ERROR:", err.message));
		console.error(kleur.red().bold(err.stack));
		console.error(
			"Data: ",
			util.inspect(err.data, {
				showHidden: false,
				depth: 4,
				colors: true,
			})
		);
	}
}

/**
 * Command option declarations
 * @param {import("commander").Command} program Commander
 * @param {import("moleculer").ServiceBroker} broker Moleculer's Service Broker
 * @param {Function} cmdHandler Command handler
 */
function declaration(program, broker, cmdHandler) {
	// Register call command
	program
		.command("call <actionName> [jsonParams] [meta]")
		.description("Call an action")
		.option("--load [filename]", "Load params from file")
		.option(
			"--loadFull [filename]",
			'Load params and meta from file (e.g., {"params":{}, "meta":{}, "options":{}})'
		)
		.option("--$local", "Call the local service broker")
		.option("--stream [filename]", "Send a file as stream")
		.option("--save [filename]", "Save response to file")
		.allowUnknownOption(true)
		.allowExcessArguments(true)
		.hook("preAction", (thisCommand) => {
			const parsedOpts = thisCommand.parseOptions(thisCommand.args);
			const [actionName, jsonParams, meta] = parsedOpts.operands;

			let parsedArgs = {
				...parser(parsedOpts.unknown), // Other params
				...thisCommand._optionValues, // Contains flag values
			};

			const rawCommand = thisCommand.parent.rawArgs.slice(2).join(" ");

			// Set the params
			thisCommand.params = {
				options: parsedArgs,
				actionName,
				nodeID: parsedArgs.$local ? broker.nodeID : undefined,
				...(jsonParams !== undefined ? { jsonParams } : undefined),
				...(meta !== undefined ? { meta } : undefined),
				rawCommand,
			};

			// Clear the parsed values for next execution
			thisCommand._optionValues = {};
		})
		.action(async function () {
			// Get the params
			await cmdHandler(broker, this.params);
		});

	// Register dcall command
	program
		.command("dcall <nodeID> <actionName> [jsonParams] [meta]")
		.description("Direct call an action")
		.option("--load [filename]", "Load params from file")
		.option(
			"--loadFull [filename]",
			'Load params and meta from file (e.g., {"params":{}, "meta":{}, "options":{}})'
		)
		.option("--stream [filename]", "Send a file as stream")
		.option("--save [filename]", "Save response to file")
		.allowUnknownOption(true)
		.allowExcessArguments(true)
		.hook("preAction", (thisCommand) => {
			const parsedOpts = thisCommand.parseOptions(thisCommand.args);
			const [nodeID, actionName, jsonParams, meta] = parsedOpts.operands;

			let parsedArgs = {
				...parser(parsedOpts.unknown), // Other params
				...thisCommand._optionValues, // Contains flag values
			};

			const rawCommand = thisCommand.parent.rawArgs.slice(2).join(" ");

			// Set the params
			thisCommand.params = {
				options: parsedArgs,
				nodeID,
				actionName,
				...(jsonParams !== undefined ? { jsonParams } : undefined),
				...(meta !== undefined ? { meta } : undefined),
				rawCommand,
			};

			// Clear the parsed values for next execution
			thisCommand._optionValues = {};
		})
		.action(async function () {
			// Get the params
			await cmdHandler(broker, this.params);
		});
}

/**
 * Register the command
 *
 * @param {import("commander").Command} program Commander
 * @param {import("moleculer").ServiceBroker} broker Moleculer's Service Broker
 */
function register(program, broker) {
	declaration(program, broker, handler);
}

module.exports = { register, declaration, handler };
