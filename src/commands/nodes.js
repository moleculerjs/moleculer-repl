"use strict";

const chalk 			= require("chalk");
const fs 				= require("fs");
const path				= require("path");
const util 				= require("util");
const _ 				= require("lodash");
const { table, getBorderCharacters } 	= require("table");
const { match } 		= require("../utils");

module.exports = function(vorpal, broker) {
	// List nodes
	vorpal
		.command("nodes", "List of nodes")
		.option("-a, --all", "list all (offline) nodes")
		.option("-d, --details", "detailed list")
		.option("-f, --filter <match>", "filter nodes (e.g.: 'node-*')")
		.option("--raw", "print service registry to JSON")
		.option("--save [filename]", "save service registry to a JSON file")
		.action((args, done) => {
			const nodes = broker.registry.getNodeList({ onlyAvailable: false, withServices: true });

			if (args.options.save) {
				const fName = path.resolve(_.isString(args.options.save) ? args.options.save : "nodes.json");
				const nodes = broker.registry.getNodeRawList();
				fs.writeFileSync(fName, JSON.stringify(nodes, null, 4), "utf8");
				console.log(chalk.magenta.bold(`>> Node list has been saved to '${fName}' file.`));
				return done();
			}

			if (args.options.raw) {
				const nodes = broker.registry.getNodeRawList();
				console.log(util.inspect(nodes, { showHidden: false, depth: 4, colors: true }));
				return done();
			}

			// action, nodeID, cached, CB state, description?, params?
			const data = [];
			data.push([
				chalk.bold("Node ID"),
				chalk.bold("Services"),
				chalk.bold("Version"),
				chalk.bold("Client"),
				chalk.bold("IP"),
				chalk.bold("State"),
				chalk.bold("CPU")
			]);

			let hLines = [];

			nodes.sort((a, b) => a.id.localeCompare(b.id));

			nodes.forEach(node => {
				if (!args.options.all && !node.available) return;

				if (args.options.filter && !match(node.id, args.options.filter))
					return;

				let ip = "?";
				if (node.ipList) {
					if (node.ipList.length == 1)
						ip = node.ipList[0];
					else if (node.ipList.length > 1)
						ip = node.ipList[0] + `  (+${node.ipList.length - 1})`;
				}

				let cpu = "?";
				if (node.cpu != null) {
					const width = 20;
					const c = Math.round(node.cpu / (100 / width));
					cpu = ["["].concat(Array(c).fill("■"), Array(width - c).fill("."), ["] ", node.cpu.toFixed(0), "%"]).join("");
				}

				data.push([
					node.id == broker.nodeID ? chalk.gray(node.id + " (*)") : node.id,
					node.services ? Object.keys(node.services).length : 0,
					node.client.version,
					node.client.type,
					ip,
					node.available ? chalk.bgGreen.black(" ONLINE "):chalk.bgRed.white.bold(" OFFLINE "),
					cpu
				]);

				if (args.options.details && node.services && Object.keys(node.services).length > 0) {
					_.forIn(node.services, service => {
						data.push([
							"",
							service.name,
							service.version || "-",
							"",
							"",
							"",
							""
						]);
					});
					hLines.push(data.length);
				}
			});

			const tableConf = {
				border: _.mapValues(getBorderCharacters("honeywell"), (char) => {
					return chalk.gray(char);
				}),
				columns: {
					2: { alignment: "right" },
					5: { alignment: "right" }
				},
				drawHorizontalLine: (index, count) => index == 0 || index == 1 || index == count || hLines.indexOf(index) !== -1
			};

			console.log(table(data, tableConf));

			done();
		});
};
