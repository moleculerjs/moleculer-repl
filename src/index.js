/*eslint-disable no-console*/
/*
 * moleculer-repl
 * Copyright (c) 2018 MoleculerJS (https://github.com/moleculerjs/moleculer-repl)
 * MIT Licensed
 */

"use strict";

require("v8"); // Load first. It won't work in `info.js`

const _ = require("lodash");
const vorpal = require("@moleculer/vorpal")();
const { table, getBorderCharacters } = require("table");
const kleur = require("kleur");
const ora = require("ora");
const clui = require("clui");

const registerCommands = require("./commands");

const nodeRepl = require("repl");
const { parseArgsStringToArgv } = require("string-argv");

const parse = require("yargs-parser");

const commander = require("commander");
const program = new commander.Command();
program.exitOverride();
program.allowUnknownOption(true);

program.showHelpAfterError(true);
program.showSuggestionAfterError(true);

/**
 * Start REPL mode
 *
 * @param {ServiceBroker} broker
 * @param {Object|Array} opts
 */
/* istanbul ignore next */
function REPL(broker, opts) {
	if (Array.isArray(opts)) opts = { customCommands: opts };

	opts = _.defaultsDeep(opts || {}, {
		customCommands: null,
		delimiter: "mol $",
	});

	const replServer = nodeRepl.start({
		prompt: "$ ",
		completer: completer,
		eval: evaluator,
	});

	// Attach broker to the REPL context
	replServer.context.broker = broker;
}

async function evaluator(cmd, context, filename, callback) {
	const broker = context.broker;
	const argv = parseArgsStringToArgv(cmd, "node", "REPL");

	program
		.command("call <actionName> [jsonParams] [meta]")
		//.description("Call an Action")
		.option("--load [filename]", "Load params from file")
		.option("--stream [filename]", "Send a file as stream")
		.option("--save [filename]", "Save response to file")
		.allowUnknownOption(true)
		.allowExcessArguments(true)
		.hook("preAction", (thisCommand) => {
			// Parse the args
			const [actionName, ...args] = thisCommand.args;
			let parsedArgs = { ...parse(args), ...thisCommand._optionValues };
			//let parsedArgs = thisCommand._optionValues;
			delete parsedArgs._;

			// console.log(thisCommand);

			// Set the params
			thisCommand.params = {
				options: parsedArgs,
				actionName,
				rawCommand: thisCommand.args.join(" "),
			};
		})
		.action(async function () {
			// Get the params
			const args = this.params;

			console.log(args);

			try {
				const result = await broker.call(args.actionName, args.options);
				console.log(result);
			} catch (error) {
				// console.log(error);
			}

			// Clear parsed values
			this._optionValues = {};
		});

	if (argv.length !== 2) {
		try {
			await program.parseAsync(argv);
		} catch (error) {
			console.log(error);
		}
	}

	callback(null);
}

function completer(line) {
	const completions = "-test .help .error .exit .quit .q".split(" ");
	const hits = completions.filter((c) => c.startsWith(line));
	// Show all completions if none found
	return [hits.length ? hits : completions, line];
}

module.exports = REPL;
