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
const { homedir } = require("os");
const { join } = require("path");

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
 * @param {REPLOptions} opts
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

	// Setup history
	replServer.setupHistory(
		join(homedir(), ".moleculer_repl_history"),
		(err, repl) => {
			if (err)
				broker.logger.error(
					`Failed to initialize Moleculer REPL history`,
					err
				);
		}
	);

	// Caught on "Ctrl+D"
	replServer.on("exit", async () => {
		await broker.stop();
		process.exit(0);
	});

	// Attach broker to REPL's context
	replServer.context.broker = broker;

	return replServer;
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
 * @param {Partial<CustomCommand>} def Command definition
 */
function registerCustomCommands(broker, program, def) {
	const cmd = program.command(def.command);

	if (def.description) cmd.description(def.description);

	if (def.alias) {
		if (!Array.isArray(def.alias)) def.alias = [def.alias];
		def.alias.forEach((alias) => cmd.alias(alias));
	}

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

			let values = {};
			if (parsedOpts.operands.length > 0) {
				for (let i = 0; i < parsedOpts.operands.length; i++) {
					const arg = thisCommand._args[i];
					if (arg) {
						values[arg._name] = parsedOpts.operands[i];
					}
				}
			}

			let parsedArgs = {
				...parser(parsedOpts.unknown), // Other params
				...thisCommand._optionValues, // Contains commander.js flag values
			};

			const rawCommand = thisCommand.parent.rawArgs.slice(2).join(" ");

			// Set the params
			thisCommand.params = {
				options: parsedArgs,
				rawCommand,
				...values,
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

/**
 * @typedef CommandOptions
 * @property {String} option Command option. More info: https://github.com/tj/commander.js/#options
 * @property {String} description Option description
 */

/**
 * @typedef CustomCommand Custom command definition
 * @property {String} command Command declaration
 * @property {String?} description Command description
 * @property {Array<String> | String | null} alias Command alias
 * @property {Boolean?} allowUnknownOptions Allow unknown command options
 * @property {Function?} parse Custom params parser
 * @property {Array<CommandOptions>} options Command options
 * @property {Function} action Custom command handler
 */

/**
 * @typedef REPLOptions REPL Options
 * @property {String|null} delimiter REPL delimiter
 * @property {Array<CustomCommand>|CustomCommand|null} customCommands Custom commands
 */
