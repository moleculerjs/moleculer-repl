"use strict";

const chalk 			= require("chalk");

module.exports = function (vorpal, broker) {
	// Register destroy service file
	vorpal
		.removeIfExist("destroy")
		.command("destroy <serviceName> [version]", "Destroy a local service")
		.autocomplete({
			data: () => {
				let services = broker.registry.getServiceList({
					onlyLocal: true,
					onlyAvailable: true,
					skipInternal: true,
					withActions: true,
					withEvents: true
				});
				// Return only the names
				return services.map(service => service.name);
			}
		})
		.action((args, done) => {
			const serviceName = args.serviceName;
			const version = args.version;

			const service = broker.getLocalService(serviceName, version);

			if (!service) {
				console.warn(chalk.red(`Service "${serviceName}" doesn't exists!`));
				done();
				return;
			}

			const p = broker.destroyService(service);
			console.log(chalk.yellow(`>> Destroying '${serviceName}'...`));
			p.then(res => {
				console.log(chalk.green(">> Destroyed successfully!"));
			}).catch(err => {
				console.error(chalk.red(">> ERROR:", err.message));
				console.error(chalk.red(err.stack));
			}).finally(done);
		});
};
