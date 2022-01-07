"use strict";

const kleur = require("kleur");
const _ = require("lodash");

/**
 * @typedef {Object} Listener Event listener configs
 * @property {String} eventName Name of the event to listen
 * @property {String?} group Group to which listener belongs. More info: https://moleculer.services/docs/0.14/services.html#Grouping
 */

/** @type {Array<Listener>} list of events to listen*/
const listenerList = [];

/** @type {String} name of the REPL service dedicated to listen to events*/
const SERVICE_NAME = "$repl-event-listener";

/** @type {import('moleculer').ServiceSchema} */
const originalServiceSchema = {
	name: SERVICE_NAME,

	events: {},
};

/**
 * Given a list with names generates a service schema with event listeners
 *
 * @param {Array<Listener>} listenerList
 * @param {import('moleculer').ServiceBroker} broker
 * @returns {import('moleculer').ServiceSchema}
 */
function updateSchema(listenerList, broker) {
	const serviceSchema = _.cloneDeep(originalServiceSchema);

	listenerList.forEach((entry) => {
		serviceSchema.events[entry.eventName] = {
			...(entry.group !== undefined ? { group: entry.group } : undefined),
			handler(ctx) {
				broker.logger.info(
					`Event Listener '${entry.eventName}' received event`,
					ctx.params ? "with params:" : "",
					ctx.params ? ctx.params : "",
					ctx.meta ? "with meta:" : "",
					ctx.meta ? ctx.meta : ""
				);
			},
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
	// 1. Add listener to list
	listenerList.push({
		eventName: args.eventName,
		...(args.options.group !== undefined
			? { group: args.options.group }
			: undefined),
	});

	// 2. Stop the service
	try {
		await broker.destroyService(SERVICE_NAME);
	} catch (error) {
		if (error.type !== "SERVICE_NOT_FOUND") {
			console.error(kleur.red(">> ERROR:", error.message));
			console.error(kleur.red(error.stack));
		}
	}

	// 3. Update service schema
	const serviceSchema = updateSchema(listenerList, broker);

	// 4. Start the service
	try {
		broker.createService(serviceSchema);
		console.log(
			kleur.yellow().bold("REPL started listening to event:"),
			args.eventName,
			args.options.group
				? kleur.yellow().bold("belonging to group:")
				: "",
			args.options.group ? args.options.group : ""
		);
	} catch (error) {
		console.error(kleur.red(">> ERROR:", error.message));
		console.error(kleur.red(error.stack));
	}
}

/**
 * Command logic
 * @param {import("moleculer").ServiceBroker} broker Moleculer's Service Broker
 * @param {Object} args Parsed arguments
 */
async function removeListener(broker, args) {
	// 1. Find event listener
	const index = listenerList
		.map((entry) => entry.eventName)
		.indexOf(args.eventName);
	if (index === -1) {
		console.error(
			kleur.red(`>> ERROR: Event listener '${args.eventName}' not found`)
		);
		return;
	}

	// 2. Remove event from the list
	listenerList.splice(index, 1);

	// 3. Stop the service
	try {
		await broker.destroyService(SERVICE_NAME);
		console.log(
			kleur.yellow().bold("REPL stopped listening to:"),
			args.eventName
		);
	} catch (error) {
		if (error.type !== "SERVICE_NOT_FOUND") {
			console.error(kleur.red(">> ERROR:", error.message));
			console.error(kleur.red(error.stack));
		}
	}

	// Not listening to anything
	if (listenerList.length === 0) return;

	// 4. Update service schema
	const serviceSchema = updateSchema(listenerList, broker);

	// 5. Start the service with the remaining listeners
	try {
		broker.createService(serviceSchema);
	} catch (error) {
		console.error(kleur.red(">> ERROR:", error.message));
		console.error(kleur.red(error.stack));
	}
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
 * @param {Function} cmdAddListener Handler that adds new listener
 * @param {Function} cmdRemoveListener Handler that removes a listener
 * @param {Function} cmdListListeners Handler that shows all listeners
 */
function declaration(
	program,
	broker,
	cmdAddListener,
	cmdRemoveListener,
	cmdListListeners
) {
	const eventListenerCMD = program
		.command("listener")
		.description("Adds or removes event listeners");

	// Register add event listener
	eventListenerCMD
		.command("add <eventName>")
		.description("Add event listener")
		.option("--group [groupName]", "Group of event listener")
		.hook("preAction", (thisCommand) => {
			const parsedOpts = thisCommand.parseOptions(thisCommand.args);
			const [eventName] = parsedOpts.operands;

			let parsedArgs = {
				...thisCommand._optionValues, // Contains flag values
			};

			const rawCommand = thisCommand.parent.parent.rawArgs
				.slice(2)
				.join(" ");

			// Set the params
			thisCommand.params = {
				options: parsedArgs,
				eventName,
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
		.command("remove <eventName>")
		.description("Remove event listener")
		.allowUnknownOption(true)
		.allowExcessArguments(true)
		.hook("preAction", (thisCommand) => {
			const parsedOpts = thisCommand.parseOptions(thisCommand.args);
			const [eventName] = parsedOpts.operands;

			let parsedArgs = {};

			const rawCommand = thisCommand.parent.parent.rawArgs
				.slice(2)
				.join(" ");

			// Set the params
			thisCommand.params = {
				options: parsedArgs,
				eventName,
				rawCommand,
			};

			// Clear the parsed values for next execution
			thisCommand._optionValues = {};
		})
		.action(async function () {
			// Get the params
			await cmdRemoveListener(broker, this.params);
		});

	// Register list event listeners
	eventListenerCMD
		.command("list")
		.description("List events that REPL is listening to")
		.hook("preAction", (thisCommand) => {
			// Command without params. Keep for consistency sake
			let parsedArgs = {};

			const rawCommand = thisCommand.parent.parent.rawArgs
				.slice(2)
				.join(" ");

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
