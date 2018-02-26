"use strict";

const chalk 			= require("chalk");
const humanize 			= require("tiny-human-time").short;
const ora 				= require("ora");
const _ 				= require("lodash");
const { formatNumber } 	= require("../utils");

function createSpinner(text) {
	return ora({
		text,
		spinner: {
			interval: 500,
			frames: [
				".  ",
				".. ",
				"...",
				" ..",
				"  .",
				"   "
			]
		}
	});
}

module.exports = function(vorpal, broker) {
// Register benchmark
	vorpal
		.command("bench <action> [jsonParams]", "Benchmark a service")
		.autocomplete({
			data() {
				return _.uniq(broker.registry.getActionList({}).map(item => item.action.name));
			}
		})
		.option("--num <number>", "Number of iterates")
		.option("--time <seconds>", "Time of bench")
		.option("--nodeID <nodeID>", "NodeID (direct call)")
		//.allowUnknownOptions()
		.action((args, done) => {
			let payload;
			const iterate = args.options.num != null ? Number(args.options.num) : null;
			let time = args.options.time != null ? Number(args.options.time) : null;
			if (!iterate && !time)
				time = 5;

			const spinner = createSpinner("Running benchmark...");

			//console.log(args);
			if (typeof(args.jsonParams) == "string")
				payload = JSON.parse(args.jsonParams);
			// else
			// 	payload = convertArgs(args.options);

			const callingOpts = args.options.nodeID ? { nodeID: args.options.nodeID } : undefined;

			let count = 0;
			let resCount = 0;
			let errorCount = 0;
			let sumTime = 0;
			let minTime;
			let maxTime;

			let timeout = false;

			setTimeout(() => timeout = true, (time ? time : 60) * 1000);
			let startTotalTime = process.hrtime();

			const printResult = function(duration) {
				const errStr = errorCount > 0 ? chalk.red.bold(`${formatNumber(errorCount)} error(s) ${formatNumber(errorCount / resCount * 100)}%`) : chalk.grey("0 error");

				console.log(chalk.green.bold("\nBenchmark result:\n"));
				console.log(chalk.bold(`  ${formatNumber(resCount)} requests in ${humanize(duration)}, ${errStr}`));
				console.log("\n  Requests/sec:", chalk.bold(formatNumber(resCount / duration * 1000)));
				console.log("\n  Latency:");
				console.log("    Avg:", chalk.bold(_.padStart(humanize(sumTime / resCount), 10)));
				console.log("    Min:", chalk.bold(_.padStart(humanize(minTime), 10)));
				console.log("    Max:", chalk.bold(_.padStart(humanize(maxTime), 10)));
				console.log();
			};

			const handleResponse = function(startTime, err) {
				resCount++;

				if (err) {
					errorCount++;
				}

				const diff = process.hrtime(startTime);
				const duration = (diff[0] + diff[1] / 1e9) * 1000;
				sumTime += duration;
				if (minTime == null || duration < minTime)
					minTime = duration;
				if (maxTime == null || duration > maxTime)
					maxTime = duration;

				if (timeout || (iterate && resCount >= iterate)) {
					spinner.stop();

					const diff = process.hrtime(startTotalTime);
					const duration = (diff[0] + diff[1] / 1e9) * 1000;
					printResult(duration);

					return done();
				}

				if (count % 10 * 1000) {
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

				return broker.call(args.action, payload, callingOpts).then(res => {
					handleResponse(startTime);
					return res;
				}).catch(err => {
					handleResponse(startTime, err);
					//console.error(chalk.red.bold(">> ERROR:", err.message));
					//console.error(chalk.red.bold(err.stack));
					//console.error("Data: ", util.inspect(err.data, { showHidden: false, depth: 4, colors: true }));
				});
			}

			console.log(chalk.yellow.bold(`>> Call '${args.action}'${args.options.nodeID ? " on '" + args.options.nodeID + "'" : ""} with params:`), payload);
			spinner.start(iterate ? `Running x ${iterate} times...` : `Running ${time} second(s)...`);

			doRequest();

		});
};
