"use strict";

const chalk 			= require("chalk");
const _ 				= require("lodash");
const { table, getBorderCharacters } 	= require("table");

module.exports = function(vorpal, broker) {
	// List nodes
	vorpal
		.command("nodes", "List of nodes")
		.option("-d, --details", "detailed list")
		.option("-a, --all", "list all (offline) nodes")
		.action((args, done) => {
			const nodes = broker.registry.getNodeList(true);

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