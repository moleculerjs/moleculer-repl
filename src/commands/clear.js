"use strict";

const chalk 			= require("chalk");

module.exports = function(vorpal, broker) {
	// Clear cache
	vorpal
		.command("clear [pattern]", "Clear cache entries")
		.action((args, done) => {
			if (broker.cacher) {
				broker.cacher.clean(args.pattern).then(() => {
					console.log(chalk.yellow.bold(args.pattern ? "Cacher cleared entries by pattern." : "Cacher cleared all entries."));
					done();
				});
				return;
			}

			console.log(chalk.red.bold("No cacher."));
			done();
		});
};