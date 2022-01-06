"use strict";

const { parser } = require("../args-parser");
const kleur = require("kleur");
const _ = require("lodash");
const { table, getBorderCharacters } = require("table");
const { match } = require("../utils");

/** @type {Array<String>} list of events to listen*/
const listenerList = [];

/** @type {String} name of the REPL service dedicated to listen to events*/
const SERVICE_NAME = "$repl-event-listener";

/** @type {import('moleculer').ServiceSchema} */
const originalServiceSchema = {
	name: SERVICE_NAME,

	events: {},
};

/**
 * Given a list with names registers event listeners
 *
 * @param {Array<String>} listenerList
 * @param {import('moleculer').ServiceBroker} broker
 * @returns
 */
function updateSchema(listenerList, broker) {
	const serviceSchema = _.cloneDeep(originalServiceSchema);

	listenerList.forEach((name) => {
		serviceSchema.events[name] = function (ctx) {
			broker.logger.info(
				`Event Listener '${name}' received event`,
				ctx.params ? "with params:" : "",
				ctx.params ? ctx.params : "",
				ctx.meta ? "with meta:" : "",
				ctx.meta ? ctx.meta : ""
			);
		};
	});

	return serviceSchema;
}

/**
 * Command logic
 * @param {import("moleculer").ServiceBroker} broker Moleculer's Service Broker
 * @param {Object} args Parsed arguments
 */
async function addListener(broker, args) {
	if (!args.listenerName) return;

	// 1. Add listener to list
	listenerList.push(args.listenerName);

	try {
		// 2. Stop the service
		await broker.destroyService(SERVICE_NAME);
	} catch (error) {
		if (!error.type === "SERVICE_NOT_FOUND") broker.logger.error(error);
	}

	// 3. Update service schema
	const serviceSchema = updateSchema(listenerList, broker);

	// 4. Start the service
	broker.createService(serviceSchema);
}

/**
 * Command logic
 * @param {import("moleculer").ServiceBroker} broker Moleculer's Service Broker
 * @param {Object} args Parsed arguments
 */
async function removeListener(broker, args) {
	if (!args.listenerName) return;

	// 1. Find event listener
	const index = listenerList.indexOf(args.listenerName);
	if (index === -1) {
		console.error(
			kleur.red(
				`>> ERROR: Event listener '${args.listenerName}' not found`
			)
		);
		return;
	}
	// 2. Remove event from the list
	listenerList.splice(index, 1);

	try {
		// 3. Stop the service
		await broker.destroyService(SERVICE_NAME);
	} catch (error) {
		if (!error.type === "SERVICE_NOT_FOUND") broker.logger.error(error);
	}

	// Not listening to anything
	if (listenerList.length === 0) return;

	// 4. Update service schema
	const serviceSchema = updateSchema(listenerList, broker);

	// 5. Start the service with the listeners
	broker.createService(serviceSchema);
}

/**
 * Command logic
 * @param {import("moleculer").ServiceBroker} broker Moleculer's Service Broker
 * @param {Object} args Parsed arguments
 */
async function listListeners(broker, args) {
	console.log(kleur.yellow().bold(`>> REPL is listening to:`), listenerList);
}

/**
 * Command option declarations
 * @param {import("commander").Command} program Commander
 * @param {import("moleculer").ServiceBroker} broker Moleculer's Service Broker
 */
function declaration(
	program,
	broker,
	cmdAddListener,
	cmdRemoveListener,
	cmdListListeners
) {
	const eventListenerCMD = program.command("eventListener");

	// Register add event listener
	eventListenerCMD
		.command("add <listenerName>")
		.description("Add event listener")
		.allowUnknownOption(true)
		.allowExcessArguments(true)
		.hook("preAction", (thisCommand) => {
			const parsedOpts = thisCommand.parseOptions(thisCommand.args);
			const [listenerName] = parsedOpts.operands;

			let parsedArgs = {};

			const rawCommand = thisCommand.parent.parent.rawArgs
				.slice(2)
				.join(" ");

			// Set the params
			thisCommand.params = {
				options: parsedArgs,
				listenerName,
				rawCommand,
			};

			// Clear the parsed values for next execution
			thisCommand._optionValues = {};
		})
		.action(async function () {
			// Get the params
			await cmdAddListener(broker, this.params);
		});

	// Register remove event listener
	eventListenerCMD
		.command("remove <listenerName>")
		.description("Remove event listener")
		.allowUnknownOption(true)
		.allowExcessArguments(true)
		.hook("preAction", (thisCommand) => {
			const parsedOpts = thisCommand.parseOptions(thisCommand.args);
			const [listenerName] = parsedOpts.operands;

			let parsedArgs = {};

			const rawCommand = thisCommand.parent.parent.rawArgs
				.slice(2)
				.join(" ");

			// Set the params
			thisCommand.params = {
				options: parsedArgs,
				listenerName,
				rawCommand,
			};

			// Clear the parsed values for next execution
			thisCommand._optionValues = {};
		})
		.action(async function () {
			// Get the params
			await cmdRemoveListener(broker, this.params);
		});

	eventListenerCMD
		.command("list")
		.description("List event that REPL is listening to")
		.hook("preAction", (thisCommand) => {
			// Command without params. Keep for consistency sake
			let parsedArgs = {};

			const rawCommand = thisCommand.parent.rawArgs.slice(2).join(" ");

			// Set the params
			thisCommand.params = {
				options: parsedArgs,
				rawCommand,
			};

			// Clear the parsed values for next execution
			thisCommand._optionValues = {};
		})
		.action(async function () {
			// Get the params
			await cmdListListeners(broker, this.params);
		});
}

/**
 * Register the command
 *
 * @param {import("commander").Command} program Commander
 * @param {import("moleculer").ServiceBroker} broker Moleculer's Service Broker
 */
function register(program, broker) {
	declaration(program, broker, addListener, removeListener, listListeners);
}

module.exports = {
	register,
	declaration,
	addListener,
	removeListener,
	listListeners,
};
