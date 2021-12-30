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

function autocompleteHandler(line, broker) {
	const [command, param1, param2] = line.split(" ");

	// Empty line. No suggestions
	if (!command) return [];

	// No params yet. Command autocomplete
	if (!param1 && !param2) {
		const commandCompletions = ["call", "emit"];
		const hits = commandCompletions.filter((c) => c.startsWith(line));
		// Show all completions if none found
		return [hits.length ? hits : completions, line];
	}

	let completions;
	let hits;
	if (command === "call") {
		completions = _.uniq(
			_.compact(
				broker.registry
					.getActionList({})
					.map((item) =>
						item && item.action ? item.action.name : null
					)
			)
		);
	}

	hits = completions.filter((c) => c.startsWith(param1));
	hits = hits.map((entry) => `${command} ${entry}`);

	// console.log([hits.length ? hits : completions, line]);

	return [hits.length ? hits : completions, line];
}

async function evaluator(cmd, context, filename, callback) {
	const broker = context.broker;
	const argv = parseArgsStringToArgv(cmd, "node", "REPL");

	if (argv.length !== 2) {
		try {
			await program.parseAsync(argv);
		} catch (error) {
			// console.log(error);
		}
	}

	callback(null);
}

module.exports = REPL;
