"use strict";

const { parser } = require("../args-parser");
const kleur = require("kleur");

/**
 * Command logic
 * @param {import("moleculer").ServiceBroker} broker Moleculer's Service Broker
 * @param {Object} args Parsed arguments
 */
async function handler(broker, args) {
	const serviceName = args.serviceName;

	const service = broker.getLocalService(serviceName);

	if (!service) {
		console.warn(kleur.red(`Service "${serviceName}" doesn't exists!`));
		return;
	}

	const p = broker.destroyService(service);
	console.log(kleur.yellow(`>> Destroying '${serviceName}'...`));

	try {
		await p;
		console.log(kleur.green(">> Destroyed successfully!"));
	} catch (error) {
		console.error(kleur.red(">> ERROR:", err.message));
		console.error(kleur.red(err.stack));
	}
}

/**
 * Command option declarations
 * @param {import("commander").Command} program Commander
 * @param {import("moleculer").ServiceBroker} broker Moleculer's Service Broker
 * @param {Function} cmdHandler Command handler
 */
function declaration(program, broker, cmdHandler) {
	program
		.command("destroy <serviceName>")
		.description("Destroy a local service")
		.hook("preAction", (thisCommand) => {
			const parsedOpts = thisCommand.parseOptions(thisCommand.args);
			const [serviceName] = parsedOpts.operands;

			let parsedArgs = {
				...parser(parsedOpts.unknown), // Other params
				...thisCommand._optionValues, // Contains flag values
			};

			const rawCommand = thisCommand.parent.rawArgs.slice(2).join(" ");

			// Set the params
			thisCommand.params = {
				options: parsedArgs,
				serviceName,
				rawCommand,
			};

			// Clear the parsed values for next execution
			thisCommand._optionValues = {};
		})
		.action(async function () {
			// Get the params
			await cmdHandler(broker, this.params);
		});
}

/**
 * Register the command
 *
 * @param {import("commander").Command} program Commander
 * @param {import("moleculer").ServiceBroker} broker Moleculer's Service Broker
 */
function register(program, broker) {
	declaration(program, broker, handler);
}

module.exports = { register, declaration, handler };
