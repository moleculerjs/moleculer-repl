"use strict";

const kleur 			= require("kleur");

module.exports = function(vorpal, broker) {
	// Clear cache
	vorpal
		.removeIfExist("clear")
		.command("clear [pattern]", "Clear cache entries")
		.action((args, done) => {
			console.warn(kleur.yellow().bold("The 'clear' command is deprecated. Use the 'cache clear' instead."));

			if (broker.cacher) {
				broker.cacher.clean(args.pattern).then(() => {
					console.log(kleur.yellow().bold(args.pattern ? "Cacher cleared entries by pattern." : "Cacher cleared all entries."));
					done();
				});
				return;
			}

			console.log(kleur.red().bold("No cacher."));
			done();
		});
};
