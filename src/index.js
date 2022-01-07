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
const { parser } = require("./args-parser");

const { autocompleteHandler, getAvailableCommands } = require("./autocomplete");
const registerCommands = require("./commands");
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

	// Attach user defined commands
	if (Array.isArray(opts.customCommands)) {
		const availableCommands = getAvailableCommands(program);

		opts.customCommands.forEach((def) => {
			if (availableCommands.includes(def.name)) {
				broker.logger.warn(
					`Command called '${def.command}' already exists. Skipping...`
				);
				return;
			}
			try {
				registerCustomCommands(broker, program, def);
			} catch (error) {
				broker.logger.error(
					`An error ocurred while registering '${def.command}' command`,
					error
				);
			}
		});
	}

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
			if (
				error.code !== "commander.helpDisplayed" &&
				error.code !== "commander.unknownCommand" &&
				error.code !== "commander.unknownOption" &&
				error.code !== "commander.help" &&
				error.code !== "commander.missingArgument"
			) {
				broker.logger.error(error);
			}
		}
	}

	callback(null);
}

/**
 * Registers user defined commands
 * @param {import('moleculer').ServiceBroker} broker
 * @param {import("commander").Command} program Commander
 * @param {Object} def
 */
function registerCustomCommands(broker, program, def) {
	const cmd = program.command(def.command);

	if (def.description) cmd.description(def.description);

	if (def.alias) cmd.alias(def.alias);

	if (def.allowUnknownOptions) {
		cmd.allowUnknownOption(def.allowUnknownOptions);
		cmd.allowExcessArguments(def.allowUnknownOptions);
	}

	if (def.parse) {
		// Use custom parser
		cmd.hook("preAction", (thisCommand) => {
			def.parse.call(parser, thisCommand);
		});
	} else {
		cmd.hook("preAction", (thisCommand) => {
			const parsedOpts = thisCommand.parseOptions(thisCommand.args);

			let parsedArgs = {
				...parser(parsedOpts.unknown), // Other params
				...thisCommand._optionValues, // Contains commander.js flag values
			};

			const rawCommand = thisCommand.parent.rawArgs.slice(2).join(" ");

			// Set the params
			thisCommand.params = {
				options: parsedArgs,
				rawCommand,
			};
		});
	}

	if (def.options) {
		def.options.forEach((opt) => {
			cmd.option(opt.option, opt.description);
		});
	}

	cmd.action(async function () {
		// Clear the parsed values for next execution
		this._optionValues = {};

		const helpers = { cmd, table, kleur, ora, clui, getBorderCharacters };

		return def.action(broker, this.params, helpers);
	});
}

module.exports = REPL;
