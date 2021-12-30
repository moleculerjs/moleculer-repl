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

const nodeRepl = require("repl");
const { parseArgsStringToArgv } = require("string-argv");

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

	registerCommands(program, broker);

	const replServer = nodeRepl.start({
		prompt: "$ ",
		completer: function completer(line) {
			return autocompleteHandler(line, broker);

			const completions = "-test .help .error .exit .quit .q".split(" ");
			const hits = completions.filter((c) => c.startsWith(line));
			// Show all completions if none found
			return [hits.length ? hits : completions, line];
		},
		eval: evaluator,
	});

	// Attach broker to the REPL context
	replServer.context.broker = broker;
}

/**
 * Given a line from terminal generates a list of suggestions
 *
 * @param {String} line
 * @param {import("moleculer").ServiceBroker} broker
 * @returns {[string[], string]} List of suggestions. More info: https://nodejs.org/api/readline.html#use-of-the-completer-function
 */
function autocompleteHandler(line, broker) {
	let [command, param1, param2] = line.split(" ");

	// Empty line. Show all available commands
	const availableCommands = program.commands.map((entry) => entry._name);
	if (!command) {
		return [availableCommands, line];
	}

	// No params yet. Command autocomplete
	if (command.length > 0 && !param1 && !param2) {
		const hits = availableCommands.filter((c) => c.startsWith(command));

		// Show all completions if none found
		return [hits.length ? hits : availableCommands, line];
	}

	let completions;
	let hits;
	if (command === "call") {
		completions = actionNameAutocomplete(broker);
		hits = completions.filter((c) => c.startsWith(param1));
		hits = hits.map((entry) => `${command} ${entry}`);
		return [hits.length ? hits : completions, line];
	}

	if (command === "emit") {
		completions = eventNameAutocomplete(broker);
		hits = completions.filter((c) => c.startsWith(param1));
		hits = hits.map((entry) => `${command} ${entry}`);
		return [hits.length ? hits : completions, line];
	}
}

/**
 * Returns the list of available actions
 *
 * @param {import("moleculer").ServiceBroker} broker
 * @returns
 */
function actionNameAutocomplete(broker) {
	return _.uniq(
		_.compact(
			broker.registry
				.getActionList({})
				.map((item) => (item && item.action ? item.action.name : null))
		)
	);
}

/**
 * Returns the list of available events
 *
 * @param {import("moleculer").ServiceBroker} broker
 * @returns
 */
function eventNameAutocomplete(broker) {
	return _.uniq(
		_.compact(
			broker.registry
				.getEventList({})
				.map((item) => (item && item.event ? item.event.name : null))
		)
	);
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
	const broker = context.broker;
	const argv = parseArgsStringToArgv(cmd, "node", "REPL");

	if (argv.length !== 2) {
		try {
			await program.parseAsync(argv);
		} catch (error) {
			console.log(error);
		}
	}

	callback(null);
}

module.exports = REPL;
