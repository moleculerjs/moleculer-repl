"use strict";

const chalk 			= require("chalk");
const fs 				= require("fs");
const path 				= require("path");

module.exports = function(vorpal, broker) {
	// Register load service file
	vorpal
		.command("load <servicePath>", "Load a service from file")
		.action((args, done) => {
			let filePath = path.resolve(args.servicePath);
			if (fs.existsSync(filePath)) {
				console.log(chalk.yellow(`>> Load '${filePath}'...`));
				let service = broker.loadService(filePath);
				if (service)
					console.log(chalk.green(">> Loaded successfully!"));
			} else {
				console.warn(chalk.red("The service file is not exists!", filePath));
			}
			done();
		});	

	// Register load service folder
	vorpal
		.command("loadFolder <serviceFolder> [fileMask]", "Load all services from folder")
		.action((args, done) => {
			let filePath = path.resolve(args.serviceFolder);
			if (fs.existsSync(filePath)) {
				console.log(chalk.yellow(`>> Load services from '${filePath}'...`));
				const count = broker.loadServices(filePath, args.fileMask);
				console.log(chalk.green(`>> Loaded ${count} services!`));
			} else {
				console.warn(chalk.red("The folder is not exists!", filePath));
			}
			done();
		});	
};