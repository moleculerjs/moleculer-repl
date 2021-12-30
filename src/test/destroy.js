"use strict";

const parse = require("yargs-parser");
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
 */
module.exports = function (program, broker) {
	program
		.command("destroy <serviceName>")
		.description("Destroy a local service")
		.hook("preAction", (thisCommand) => {
			const [serviceName, ...args] = thisCommand.args;
			// Parse the unknown args + args that commander.js managed to process
			let parsedArgs = { ...parse(args), ...thisCommand._optionValues };
			delete parsedArgs._;

			// Set the params
			thisCommand.params = {
				options: parsedArgs,
				serviceName,
				rawCommand: thisCommand.args.join(" "),
			};
		})
		.action(async function () {
			// Get the params
			await handler(broker, this.params);

			// Clear the parsed values for next execution
			this._optionValues = {};
		});
};
