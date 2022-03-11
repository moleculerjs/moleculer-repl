"use strict";

const _ = require("lodash");

/**
 * Returns the list of versioned services
 *
 * @param {import("moleculer").ServiceBroker} broker
 * @returns {Array<String>}
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
 * @returns {Array<String>}
 */
function nodeIdActionNameAutocomplete(broker) {
	// Flatten to a single list
	const completions = _.uniq(
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

	return _.flatten(completions);
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
 * Returns list of available commands
 * @param {import('commander').Command} program
 * @returns {String[]} Available commands
 */
function getAvailableCommands(program) {
	let availableCommands = program.commands.map((entry) => [
		entry._name,
		...entry._aliases,
	]);
	availableCommands = _.flatten(availableCommands);

	return availableCommands;
}

/**
 * Given a line from terminal generates a list of suggestions
 *
 * @param {String} line
 * @param {import("moleculer").ServiceBroker} broker
 * @param {import('commander').Command} program
 * @returns {[String[], String]} List of suggestions. More info: https://nodejs.org/api/readline.html#use-of-the-completer-function
 */
function autocompleteHandler(line, broker, program) {
	let [command, ...rest] = line.split(" ");

	const availableCommands = getAvailableCommands(program);

	// Empty line. Show all available commands
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
		case "cache": {
			completions = ["keys", "clear"];
			break;
		}
		case "listener": {
			completions = ["add", "remove", "list"];
			break;
		}
		case "bench":
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

module.exports = { autocompleteHandler, getAvailableCommands };
