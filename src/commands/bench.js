"use strict";

const { parser } = require("../args-parser");
const kleur = require("kleur");
const humanize = require("tiny-human-time").short;
const ora = require("ora");
const _ = require("lodash");
const { formatNumber } = require("../utils");

const { flagParseInt } = require("../flag-processing");

function createSpinner(text) {
	return ora({
		text,
		spinner: {
			interval: 500,
			frames: [".  ", ".. ", "...", " ..", "  .", "   "],
		},
	});
}

/**
 * Command logic
 * @param {import("moleculer").ServiceBroker} broker Moleculer's Service Broker
 * @param {Object} args Parsed arguments
 */
async function handler(broker, args) {
	let payload;
	const iterate = args.options.num != null ? Number(args.options.num) : null;
	let time = args.options.time != null ? Number(args.options.time) : null;
	if (!iterate && !time) time = 5;

	const spinner = createSpinner("Running benchmark...");

	//console.log(args);
	if (typeof args.jsonParams == "string") {
		try {
			payload = JSON.parse(args.jsonParams);
		} catch (err) {
			console.error(
				kleur.red().bold(">> ERROR:", err.message, args.jsonParams)
			);
			console.error(kleur.red().bold(err.stack));
			// done();
			return;
		}
	}

	let meta;
	if (typeof args.meta === "string") {
		try {
			meta = JSON.parse(args.meta);
		} catch (err) {
			console.error(kleur.red().bold("Can't parse [meta]"), args.meta);
			// done();
			return;
		}
	}

	const callingOpts = { meta };

	if (args.options.nodeID) callingOpts.nodeID = args.options.nodeID;

	let count = 0;
	let resCount = 0;
	let errorCount = 0;
	let sumTime = 0;
	let minTime;
	let maxTime;

	let timeout = false;

	setTimeout(() => (timeout = true), (time ? time : 60) * 1000);
	let startTotalTime = process.hrtime();

	const printResult = function (duration) {
		const errStr =
			errorCount > 0
				? kleur
						.red()
						.bold(
							`${formatNumber(
								errorCount
							)} error(s) ${formatNumber(
								(errorCount / resCount) * 100
							)}%`
						)
				: kleur.grey("0 error");

		console.log(kleur.green().bold("\nBenchmark result:\n"));
		console.log(
			kleur.bold(
				`  ${formatNumber(resCount)} requests in ${humanize(
					duration
				)}, ${errStr}`
			)
		);
		console.log(
			"\n  Requests/sec:",
			kleur.bold(formatNumber((resCount / duration) * 1000))
		);
		console.log("\n  Latency:");
		console.log(
			"    Avg:",
			kleur.bold(_.padStart(humanize(sumTime / resCount), 10))
		);
		console.log("    Min:", kleur.bold(_.padStart(humanize(minTime), 10)));
		console.log("    Max:", kleur.bold(_.padStart(humanize(maxTime), 10)));
		console.log();
	};

	const handleResponse = function (startTime, err) {
		resCount++;

		if (err) {
			errorCount++;
		}

		const diff = process.hrtime(startTime);
		const duration = (diff[0] + diff[1] / 1e9) * 1000;
		sumTime += duration;
		if (minTime == null || duration < minTime) minTime = duration;
		if (maxTime == null || duration > maxTime) maxTime = duration;

		if (timeout || (iterate && resCount >= iterate)) {
			spinner.stop();

			const diff = process.hrtime(startTotalTime);
			const duration = (diff[0] + diff[1] / 1e9) * 1000;
			printResult(duration);

			// return done();
			return;
		}

		if ((count % 10) * 1000) {
			// Fast cycle
			doRequest();
		} else {
			// Slow cycle
			setImmediate(() => doRequest());
		}
	};

	function doRequest() {
		count++;
		const startTime = process.hrtime();

		return broker
			.call(args.action, payload, callingOpts)
			.then((res) => {
				handleResponse(startTime);
				return res;
			})
			.catch((err) => {
				handleResponse(startTime, err);
				//console.error(kleur.red().bold(">> ERROR:", err.message));
				//console.error(kleur.red().bold(err.stack));
				//console.error("Data: ", util.inspect(err.data, { showHidden: false, depth: 4, colors: true }));
			});
	}

	console.log(
		kleur
			.yellow()
			.bold(
				`>> Call '${args.action}'${
					args.options.nodeID
						? " on '" + args.options.nodeID + "'"
						: ""
				} with params:`
			),
		payload
	);
	spinner.start(
		iterate
			? `Running x ${iterate} times...`
			: `Running ${time} second(s)...`
	);

	doRequest();
}

/**
 * Command option declarations
 * @param {import("commander").Command} program Commander
 * @param {import("moleculer").ServiceBroker} broker Moleculer's Service Broker
 * @param {Function} cmdHandler Command handler
 */
function declaration(program, broker, cmdHandler) {
	program
		.command("bench <action> [jsonParams] [meta]")
		.description("Benchmark service action")
		.option("--num <number>", "Number of iterates", flagParseInt)
		.option("--time <seconds>", "Time of bench", flagParseInt)
		.option("--nodeID <nodeID>", "NodeID (direct call)")
		.allowUnknownOption(true)
		.allowExcessArguments(true)
		.hook("preAction", (thisCommand) => {
			const parsedOpts = thisCommand.parseOptions(thisCommand.args);
			const [action, jsonParams] = parsedOpts.operands;

			let parsedArgs = {
				...parser(parsedOpts.unknown), // Other params
				...thisCommand._optionValues, // Contains flag values
			};

			const rawCommand = thisCommand.parent.rawArgs.slice(2).join(" ");

			// Set the params
			thisCommand.params = {
				options: parsedArgs,
				action,
				...(jsonParams !== undefined ? { jsonParams } : undefined),
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
