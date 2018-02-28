/*eslint-disable no-console*/
/*
 * moleculer-repl
 * Copyright (c) 2017 MoleculerJS (https://github.com/moleculerjs/moleculer-repl)
 * MIT Licensed
 */

"use strict";

require("v8"); // Load first. It won't work in `info.js`

const vorpal 			= require("vorpal")();
const { table, getBorderCharacters } 	= require("table");
const chalk 			= require("chalk");
const ora 				= require("ora");
const clui 				= require("clui");

const registerCommands 	= require("./commands");

/**
 * Start REPL mode
 *
 * @param {ServiceBroker} broker
 * @param {Array} customCommands
 */
/* istanbul ignore next */
function REPL(broker, customCommands) {
	vorpal.find("exit").remove(); //vorpal vorpal-commons.js command, fails to run .stop() on exit

	vorpal.on("vorpal_exit", () => {
		broker.stop().then(() => process.exit(0));
	}); //vorpal exit event (Ctrl-C)

	vorpal
		.command("q", "Exit application")
		.alias("quit")
		.alias("exit")
		.action((args, done) => {
			broker.stop().then(() => process.exit(0));
			done();
		});

	// Register general commands
	registerCommands(vorpal, broker);

	// Register custom commands
	if (Array.isArray(customCommands)) {
		customCommands.forEach(def => {
			let cmd = vorpal.command(def.command, def.description);
			if (def.alias)
				cmd.alias(def.alias);

			if (Array.isArray(def.options)) {
				def.options.forEach(opt => cmd.option(opt.option, opt.description, opt.autocomplete));
			}

			if (def.parse)
				cmd.parse(def.parse);

			if (def.types)
				cmd.types(def.types);

			if (def.help)
				cmd.help(def.help);

			if (def.validate)
				cmd.validate(def.validate);

			if (def.allowUnknownOptions)
				cmd.allowUnknownOptions();

			cmd.action(args => {
				const helpers = { vorpal, table, chalk, ora, clui, getBorderCharacters };
				return def.action(broker, args, helpers);
			});

			if (def.cancel)
				cmd.cancel(def.cancel);
		});
	}

	// Start REPL
	vorpal
		.delimiter("mol $")
		.show();

}

module.exports = REPL;
