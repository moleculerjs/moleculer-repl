"use strict";

const chalk 			= require("chalk");
const fs 				= require("fs");
const path				= require("path");
const _ 				= require("lodash");
const util 				= require("util");
const { convertArgs } 	= require("../utils");
const humanize 			= require("tiny-human-time").short;
const isStream			= require("is-stream");

function call(broker, args, done) {
	let payload;
	let meta = {};
	console.log(args);
	if (typeof(args.jsonParams) == "string")
		try {
			payload = JSON.parse(args.jsonParams);
		} catch(err) {
			console.error(chalk.red.bold(">> ERROR:", err.message));
			console.error(chalk.red.bold(err.stack));
			done();
			return;
		}
	else {
		payload = convertArgs(args.options);
		if (args.options.save)
			delete payload.save;
	}

	if (typeof(args.meta) === "string") {
		try {
			meta = JSON.parse(args.meta);
		} catch(err) {
			console.error(chalk.red.bold("Can't parse [meta]"));
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
			console.log(chalk.magenta(`>> Load params from '${fName}' file.`));
			payload = JSON.parse(fs.readFileSync(fName, "utf8"));
		} else {
			console.log(chalk.red(">> File not found:", fName));
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
			console.log(chalk.magenta(`>> Load stream from '${fName}' file.`));
			payload = fs.createReadStream(fName);
		} else {
			console.log(chalk.red(">> File not found:", fName));
		}
	}

	const startTime = process.hrtime();
	const nodeID = args.nodeID;
	console.log(chalk.yellow.bold(`>> Call '${args.actionName}'${nodeID ? " on " + nodeID : ""}`), isStream(payload) ? "with <Stream>." : "with params:", isStream(payload) ? "" : payload);
	broker.call(args.actionName, payload, { meta, nodeID })
		.then(res => {
			const diff = process.hrtime(startTime);
			const duration = (diff[0] + diff[1] / 1e9) * 1000;
			console.log(chalk.cyan.bold(">> Execution time:", humanize(duration)));

			console.log(chalk.yellow.bold(">> Response:"));
			if (isStream(res)) {
				console.log("<Stream>");
			} else {
				console.log(util.inspect(res, { showHidden: false, depth: 4, colors: true }));
			}

			// Save response to file
			if (args.options.save && res != null)  {
				let fName;
				if (_.isString(args.options.save)) {
					fName = path.resolve(args.options.save);
				} else {
					fName = path.join(".", `${args.actionName}.response`);
					if (isStream(res))
						fName += ".stream";
					else
						fName += _.isObject(res) ? ".json" : ".txt";
				}

				if (isStream(res)) {
					res.pipe(fs.createWriteStream(fName));
				} else {
					fs.writeFileSync(fName, _.isObject(res) ? JSON.stringify(res, null, 4) : res, "utf8");
				}
				console.log(chalk.magenta.bold(`>> Response has been saved to '${fName}' file.`));
			}
		})
		.catch(err => {
			console.error(chalk.red.bold(">> ERROR:", err.message));
			console.error(chalk.red.bold(err.stack));
			console.error("Data: ", util.inspect(err.data, { showHidden: false, depth: 4, colors: true }));
		})
		.finally(done);
}

module.exports = function(vorpal, broker) {
	// Register broker.call
	vorpal
		.command("call <actionName> [jsonParams] [meta]", "Call an action")
		.autocomplete({
			data() {
				return _.uniq(_.compact(broker.registry.getActionList({}).map(item => item && item.action ? item.action.name: null)));
			}
		})
		.option("--load [filename]", "Load params from file")
		.option("--stream [filename]", "Send a file as stream")
		.option("--save [filename]", "Save response to file")
		.allowUnknownOptions()
		.action((args, done) => call(broker, args, done));

	// Register direct broker.call
	vorpal
		.command("dcall <nodeID> <actionName> [jsonParams] [meta]", "Direct call an action")
		.option("--load [filename]", "Load params from file")
		.option("--stream [filename]", "Send a file as stream")
		.option("--save [filename]", "Save response to file")
		.allowUnknownOptions()
		.action((args, done) => call(broker, args, done));
};
