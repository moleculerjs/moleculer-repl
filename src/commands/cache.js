"use strict";

const kleur 			= require("kleur");
const _ 				= require("lodash");
const { table, getBorderCharacters } 	= require("table");
const { match } 		= require("../utils");

module.exports = function(vorpal, broker) {
	// Register cache commands
	vorpal
		.removeIfExist("cache keys")
		.command("cache keys", "List keys of cache entries")
		.option("-f, --filter <match>", "filter keys")
		.action((args, done) => {
			if (!broker.cacher) {
				console.log(kleur.red().bold("No cacher."));
				return done();
			}

			if (!_.isFunction(broker.cacher.getCacheKeys)) {
				console.log(kleur.yellow().bold("Cacher is not compatible. Missing 'getCacheKeys' method."));
				return done();
			}

			broker.cacher.getCacheKeys().then((entries) => {
				const data = [
					[
						kleur.bold("Key"),
						//kleur.bold("Expires at"),
					]
				];

				entries.sort((a, b) => a.key.localeCompare(b.key));

				//let hLines = [];

				entries.forEach(item => {

					if (args.options.filter && !match(item.key, args.options.filter))
						return;

					data.push([
						item.key,
						//item.expiresAt
					]);
				});

				const tableConf = {
					border: _.mapValues(getBorderCharacters("honeywell"), char => kleur.gray(char)),
					columns: {},
					//drawHorizontalLine: (index, count) => index == 0 || index == 1 || index == count || hLines.indexOf(index) !== -1
				};

				console.log(table(data, tableConf));

				done();
			}).catch(err => {
				console.error(err);
				done();
			});
		});


	// Clear cache
	vorpal
		.removeIfExist("cache clear")
		.command("cache clear [pattern]", "Clear cache entries")
		.action((args, done) => {
			if (broker.cacher) {
				broker.cacher.clean(args.pattern).then(() => {
					console.log(kleur.yellow().bold(args.pattern ? "Cacher cleared entries by pattern." : "Cacher cleared all entries."));
					done();
				}).catch(err => {
					console.error(err);
					done();
				});
				return;
			}

			console.log(kleur.red().bold("No cacher."));
			done();
		});
};
