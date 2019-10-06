"use strict";

const kleur 			= require("kleur");

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
				console.warn(kleur.red(`Service "${serviceName}" doesn't exists!`));
				done();
				return;
			}

			const p = broker.destroyService(service);
			console.log(kleur.yellow(`>> Destroying '${serviceName}'...`));
			p.then(res => {
				console.log(kleur.green(">> Destroyed successfully!"));
			}).catch(err => {
				console.error(kleur.red(">> ERROR:", err.message));
				console.error(kleur.red(err.stack));
			}).finally(done);
		});
};
