/*eslint-disable no-console*/
/*
 * moleculer-repl
 * Copyright (c) 2018 MoleculerJS (https://github.com/moleculerjs/moleculer-repl)
 * MIT Licensed
 */

"use strict";

require("v8"); // Load first. It won't work in `info.js`

const _ = require("lodash");
const { table, getBorderCharacters } = require("table");
const kleur = require("kleur");
const ora = require("ora");
const clui = require("clui");

const nodeRepl = require("repl");
const { parseArgsStringToArgv } = require("string-argv");

const { autocompleteHandler } = require("./autocomplete");
const registerCommands = require("./test");
const commander = require("commander");
const program = new commander.Command();
program.exitOverride();
program.allowUnknownOption(true);

program.showHelpAfterError(true);
program.showSuggestionAfterError(true);

/**
 * Start REPL mode
 *
 * @param {import("moleculer").ServiceBroker} broker
 * @param {Object|Array} opts
 */
/* istanbul ignore next */
function REPL(broker, opts) {
	if (Array.isArray(opts)) opts = { customCommands: opts };

	opts = _.defaultsDeep(opts || {}, {
		customCommands: null,
		delimiter: "mol $",
	});

	// Attach the commands to the program
	registerCommands(program, broker);

	// Start the server
	const replServer = nodeRepl.start({
		prompt: opts.delimiter.endsWith(" ")
			? opts.delimiter
			: opts.delimiter + " ", // Add empty space
		completer: (line) => autocompleteHandler(line, broker, program),
		eval: evaluator,
	});

	// Caught on "Ctrl+D"
	replServer.on("exit", async () => {
		await broker.stop();
		process.exit(0);
	});

	// Attach broker to REPL's context
	replServer.context.broker = broker;
}

/**
 * Node.js custom evaluation function
 * More info: https://nodejs.org/api/repl.html#custom-evaluation-functions
 *
 * @param {String} cmd
 * @param {import("vm").Context} context
 * @param {String} filename
 * @param {Function} callback
 */
async function evaluator(cmd, context, filename, callback) {
	/** @type {import('moleculer').ServiceBroker} */
	const broker = this.context.broker;
	const argv = parseArgsStringToArgv(cmd, "node", "Moleculer REPL");

	if (argv.length !== 2) {
		try {
			await program.parseAsync(argv);
		} catch (error) {
			//if (error.code !== "commander.helpDisplayed") {
			//	broker.logger.error(error);
			//}
		}
	}

	callback(null);
}

module.exports = REPL;
