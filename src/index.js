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

	// Attach the commands to the program
	registerCommands(program, broker);

	// Start the server
	const replServer = nodeRepl.start({
		prompt: "$ ",
		completer: function completer(line) {
			return autocompleteHandler(line, broker);
			// From docs
			const completions = "-test .help .error .exit .quit .q".split(" ");
			const hits = completions.filter((c) => c.startsWith(line));
			// Show all completions if none found
			return [hits.length ? hits : completions, line];
		},
		eval: evaluator,
	});

	// Attach broker to the REPL's context
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
	let [command, ...rest] = line.split(" ");

	// Empty line. Show all available commands
	const availableCommands = program.commands.map((entry) => entry._name);
	if (!command) {
		return [availableCommands, line];
	}

	// Check if command value is complete
	if (!availableCommands.includes(command)) {
		// Unknown or incomplete command. Try to provide a suggestion
		const hits = availableCommands.filter((c) => c.startsWith(command));

		// Show all completions if none found
		return [hits.length ? hits : availableCommands, line];
	}

	// From here we already know what command will be executed //

	let completions = [];
	switch (command) {
		case "call": {
			completions = actionNameAutocomplete(broker);
			break;
		}
		case "broadcast":
		case "broadcastLocal":
		case "emit": {
			completions = eventNameAutocomplete(broker);
			break;
		}
		case "dcall": {
			completions = nodeIdActionNameAutocomplete(broker);
			// Flatten to a single list
			completions = _.flatten(completions);
			break;
		}
		case "destroy": {
			completions = versionedServicesAutocomplete(broker);
			break;
		}
	}

	completions = completions.map((entry) => `${command} ${entry}`);
	// Match the command + action/event name against partial "line" value
	let hits = completions.filter((c) => c.startsWith(line));
	return [hits.length ? hits : completions, line];
}

/**
 * Returns the list of versioned services
 *
 * @param {import("moleculer").ServiceBroker} broker
 * @returns {Array<Array<String>>}
 */
function versionedServicesAutocomplete(broker) {
	let services = broker.registry.getServiceList({
		onlyLocal: true,
		onlyAvailable: true,
		skipInternal: true,
		withActions: true,
		withEvents: true,
	});

	// Return only the names
	return services.map((service) => service.fullName);
}

/**
 * Returns the list of nodes and their actions in the following format "<nodeID> <actionName>"
 *
 * @param {import("moleculer").ServiceBroker} broker
 * @returns {Array<Array<String>>}
 */
function nodeIdActionNameAutocomplete(broker) {
	return _.uniq(
		_.compact(
			broker.registry
				.getNodeList({ onlyAvailable: true, withServices: true })
				.map((node) => {
					// return node && node.id;

					// Get actions of the node
					let actionList = node.services.map((svc) => {
						return Object.values(svc.actions).map((action) => {
							return action.name;
						});
					});

					actionList = _.flatten(actionList);

					// Create "<nodeID> <action name> command for autocomplete
					actionList = actionList.map(
						(actionName) => `${node.id} ${actionName}`
					);

					return actionList;
				})
		)
	);
}

/**
 * Returns the list of available actions
 *
 * @param {import("moleculer").ServiceBroker} broker
 * @returns {Array<String>}
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
 * @returns {Array<String>}
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
			// console.log(error);
		}
	}

	callback(null);
}

module.exports = REPL;
