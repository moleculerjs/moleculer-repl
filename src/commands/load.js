"use strict";

const { parser } = require("../args-parser");
const kleur = require("kleur");
const fs = require("fs");
const path = require("path");

/**
 * Command logic
 * @param {import("moleculer").ServiceBroker} broker Moleculer's Service Broker
 * @param {Object} args Parsed arguments
 */
async function loadHandler(broker, args) {
	let filePath = path.resolve(args.servicePath);
	if (fs.existsSync(filePath)) {
		console.log(kleur.yellow(`>> Load '${filePath}'...`));
		let service = broker.loadService(filePath);
		if (service) console.log(kleur.green(">> Loaded successfully!"));
	} else {
		console.warn(kleur.red("The service file is not exists!", filePath));
	}
}

/**
 * Command logic
 * @param {import("moleculer").ServiceBroker} broker Moleculer's Service Broker
 * @param {Object} args Parsed arguments
 */
async function loadFolderHandler(broker, args) {
	let filePath = path.resolve(args.serviceFolder);
	if (fs.existsSync(filePath)) {
		console.log(kleur.yellow(`>> Load services from '${filePath}'...`));
		const count = broker.loadServices(filePath, args.fileMask);
		console.log(kleur.green(`>> Loaded ${count} services!`));
	} else {
		console.warn(kleur.red("The folder is not exists!", filePath));
	}
}

/**
 * Command option declarations
 * @param {import("commander").Command} program Commander
 * @param {import("moleculer").ServiceBroker} broker Moleculer's Service Broker
 * @param {Function} cmdLoadHandler Command handler for loading a single service
 * @param {Function} cmdLoadFolderHandler Command handler for loading services from a folder
 */
function declaration(program, broker, cmdLoadHandler, cmdLoadFolderHandler) {
	// Register load command
	program
		.command("load <servicePath>")
		.description("Load a service from file")
		.hook("preAction", (thisCommand) => {
			const parsedOpts = thisCommand.parseOptions(thisCommand.args);
			const [servicePath] = parsedOpts.operands;

			let parsedArgs = {
				...parser(parsedOpts.unknown), // Other params
				...thisCommand._optionValues, // Contains flag values
			};

			const rawCommand = thisCommand.parent.rawArgs.slice(2).join(" ");

			// Set the params
			thisCommand.params = {
				options: parsedArgs,
				servicePath,
				rawCommand,
			};

			// Clear the parsed values for next execution
			thisCommand._optionValues = {};
		})
		.action(async function () {
			// Get the params
			await cmdLoadHandler(broker, this.params);
		});

	// Register loadFolder command
	program
		.command("loadFolder <serviceFolder> [fileMask]")
		.description("Load all services from folder")
		.hook("preAction", (thisCommand) => {
			const parsedOpts = thisCommand.parseOptions(thisCommand.args);
			const [serviceFolder] = parsedOpts.operands;

			let parsedArgs = {
				...parser(parsedOpts.unknown), // Other params
				...thisCommand._optionValues, // Contains flag values
			};

			const rawCommand = thisCommand.parent.rawArgs.slice(2).join(" ");

			// Set the params
			thisCommand.params = {
				options: parsedArgs,
				serviceFolder,
				rawCommand,
			};

			// Clear the parsed values for next execution
			thisCommand._optionValues = {};
		})
		.action(async function () {
			// Get the params
			await cmdLoadFolderHandler(broker, this.params);
		});
}

/**
 * Register the command
 *
 * @param {import("commander").Command} program Commander
 * @param {import("moleculer").ServiceBroker} broker Moleculer's Service Broker
 */
function register(program, broker) {
	declaration(program, broker, loadHandler, loadFolderHandler);
}

module.exports = { register, declaration, loadHandler, loadFolderHandler };
