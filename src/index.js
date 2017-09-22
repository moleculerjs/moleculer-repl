/*eslint-disable no-console*/
/*
 * moleculer-repl
 * Copyright (c) 2017 Ice Services (https://github.com/ice-services/moleculer-repl)
 * MIT Licensed
 */

"use strict";

const fs 								= require("fs");
const path 								= require("path");
const util 								= require("util");
const os 								= require("os");
const v8 								= require("v8");
const _ 								= require("lodash");
const chalk 							= require("chalk");
const { table, getBorderCharacters } 	= require("table");
const vorpal 							= require("vorpal")();
const clui 								= require("clui");
const pretty 							= require("pretty-bytes");

const CIRCUIT_CLOSE 					= "close";
const CIRCUIT_HALF_OPEN 				= "half_open";
const CIRCUIT_OPEN 						= "open";

/* istanbul ignore next */
/*
const eventHandler = payload => {
	console.log(chalk.magenta(">> Incoming event!"), util.inspect(payload, { showHidden: false, depth: 4, colors: true }));
};*/

function convertArgs(args) {
	let res = {};
	_.forIn(args, (value, key) => {
		if (typeof(value) == "object")
			res[key] = convertArgs(value);
		else if (value === "true")
			res[key] = true;
		else if (value === "false")
			res[key] = false;
		else
			res[key] = value;
	});
	return res;
}

/**
 * Start REPL mode
 * 
 * @param {ServiceBroker} broker 
 */
/* istanbul ignore next */
function REPL(broker) {
	vorpal
		.command("q", "Exit application")
		.action((args, done) => {
			broker.stop().then(() => process.exit(0));
			done();
		});

	// Register broker.call
	vorpal
		.command("call <actionName>", "Call an action")
		.autocomplete({
			data() {
				return _.uniq(broker.registry.getActionList({}).map(item => item.action.name));
			}
		})
		.allowUnknownOptions()
		.action((args, done) => {
			const payload = convertArgs(args.options);
			console.log(chalk.yellow.bold(`>> Call '${args.actionName}' with params:`), payload);
			broker.call(args.actionName, payload)
				.then(res => {
					console.log(chalk.yellow.bold(">> Response:"));
					console.log(util.inspect(res, { showHidden: false, depth: 4, colors: true }));
				})
				.catch(err => {
					console.error(chalk.red.bold(">> ERROR:", err.message));
					console.error(chalk.red.bold(err.stack));
					console.error("Data: ", util.inspect(err.data, { showHidden: false, depth: 4, colors: true }));
				})
				.finally(done);
		});

	// Register direct broker.call
	vorpal
		.command("dcall <nodeID> <actionName>", "Direct call an action ")
		.allowUnknownOptions()
		.action((args, done) => {
			const payload = convertArgs(args.options);
			const nodeID = args.nodeID;
			console.log(chalk.yellow.bold(`>> Call '${args.actionName}' on '${nodeID}' with params:`), payload);
			broker.call(args.actionName, payload, { nodeID })
				.then(res => {
					console.log(chalk.yellow.bold(">> Response:"));
					console.log(util.inspect(res, { showHidden: false, depth: 4, colors: true }));
				})
				.catch(err => {
					console.error(chalk.red.bold(">> ERROR:", err.message));
					console.error(chalk.red.bold(err.stack));
					console.error("Data: ", util.inspect(err.data, { showHidden: false, depth: 4, colors: true }));
				})
				.finally(done);
		});

	// Register broker.emit
	vorpal
		.command("emit <eventName>", "Emit an event")
		.allowUnknownOptions()
		.action((args, done) => {
			const payload = convertArgs(args.options);
			console.log(chalk.yellow.bold(`>> Emit '${args.eventName}' with payload:`), payload);
			broker.emit(args.eventName, payload);
			done();
		});

	// Register broker.broadcast
	vorpal
		.command("broadcast <eventName>", "Broadcast an event")
		.allowUnknownOptions()
		.action((args, done) => {
			const payload = convertArgs(args.options);
			console.log(chalk.yellow.bold(`>> Broadcast '${args.eventName}' with payload:`), payload);
			broker.broadcast(args.eventName, payload);
			done();
		});

	// Register broker.broadcast
	vorpal
		.command("broadcastLocal <eventName>", "Broadcast an event to local services")
		.allowUnknownOptions()
		.action((args, done) => {
			const payload = convertArgs(args.options);
			console.log(chalk.yellow.bold(`>> Broadcast '${args.eventName}' locally with payload:`), payload);
			broker.broadcastLocal(args.eventName, payload);
			done();
		});

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
		.command("loadFolder <serviceFolder> [fileMask]", "Load all service from folder")
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

	// List actions
	vorpal
		.command("actions", "List of actions")
		.option("-l, --local", "Only local actions")
		.option("-i, --skipinternal", "Skip internal actions")
		.option("-d, --details", "Print endpoints")
		.action((args, done) => {
			const actions = broker.registry.getActionList({ onlyLocal: args.options.local, skipInternal: args.options.skipinternal, withEndpoints: args.options.details });

			const data = [
				[
					chalk.bold("Action"),
					chalk.bold("Nodes"),
					chalk.bold("State"),
					chalk.bold("Cached"),
					chalk.bold("Params")
				]
			];

			actions.forEach(item => {
				const action = item.action;
				const state = item.available;
				const params = action && action.params ? Object.keys(action.params).join(", ") : "";
				
				if (action) {
					data.push([
						action.name,
						(item.hasLocal ? "(*) " : "") + item.count,
						state ? chalk.bgGreen.white("   OK   "):chalk.bgRed.white.bold(" FAILED "),
						action.cache ? chalk.green("Yes"):chalk.gray("No"),
						params
					]);
				} else {
					data.push([
						item.name,
						item.count,
						chalk.bgRed.white.bold(" FAILED "),
						"",
						""
					]);
				}

				let getStateLabel = (state) => {
					switch(state) {
					case true:
					case CIRCUIT_CLOSE:			return chalk.bgGreen.white( "   OK   ");
					case CIRCUIT_HALF_OPEN: 	return chalk.bgYellow.black(" TRYING ");
					case CIRCUIT_OPEN: 			return chalk.bgRed.white(	" FAILED ");
					}
				};

				if (args.options.details && item.endpoints) {
					item.endpoints.forEach(endpoint => {
						data.push([
							"",
							endpoint.nodeID == broker.nodeID ? chalk.gray("<local>") : endpoint.nodeID,
							getStateLabel(endpoint.state),
							"",
							""
						]);						
					});
				}
			});

			const tableConf = {
				border: _.mapValues(getBorderCharacters("honeywell"), char => chalk.gray(char)),
				columns: {
					1: { alignment: "right" },
					3: { alignment: "center" },
					5: { width: 20, wrapWord: true }
				}
			};
			
			console.log(table(data, tableConf));
			done();
		});	

	// List events
	vorpal
		.command("events", "List of events")
		.option("-l, --local", "Only local events")
		.option("-i, --skipinternal", "Skip internal events")
		.option("-d, --details", "Print endpoints")
		.action((args, done) => {
			const events = broker.registry.getEventList({ onlyLocal: args.options.local, skipInternal: args.options.skipinternal, withEndpoints: args.options.details });

			const data = [
				[
					chalk.bold("Event"),
					chalk.bold("Nodes")
				]
			];

			events.forEach(item => {
				const event = item.event;
				
				if (event) {
					data.push([
						event.name,
						(item.hasLocal ? "(*) " : "") + item.count
					]);
				} else {
					data.push([
						item.name,
						item.count
					]);
				}

				if (args.options.details && item.endpoints) {
					item.endpoints.forEach(endpoint => {
						data.push([
							"",
							endpoint.nodeID == broker.nodeID ? chalk.gray("<local>") : endpoint.nodeID,
						]);						
					});
				}
			});

			const tableConf = {
				border: _.mapValues(getBorderCharacters("honeywell"), char => chalk.gray(char)),
				columns: {
					1: { alignment: "right" }
				}
			};
			
			console.log(table(data, tableConf));
			done();
		});	

	// List services
	vorpal
		.command("services", "List of services")
		.option("-l, --local", "Only local services")
		.option("-i, --skipinternal", "Skip internal services")
		.action((args, done) => {
			const services = broker.registry.getServiceList({ onlyLocal: args.options.local, skipInternal: args.options.skipinternal, withActions: true, withEvents: true });

			const data = [
				[
					chalk.bold("Service"),
					chalk.bold("Version"),
					chalk.bold("Actions"),
					chalk.bold("Events"),
					chalk.bold("Nodes")
				]
			];

			let list = [];

			services.forEach(svc => {
				let item = list.find(o => o.name == svc.name && o.version == svc.version);
				if (item) {
					item.nodes.push(svc.nodeID);
				} else {
					item = _.pick(svc, ["name", "version"]);
					item.nodes = [svc.nodeID];
					item.actionCount = Object.keys(svc.actions).length;
					item.eventCount = Object.keys(svc.events).length;
					list.push(item);
				}
			});

			list.forEach(item => {
				const hasLocal = item.nodes.indexOf(broker.nodeID) !== -1;
				const nodeCount = item.nodes.length;
				
				data.push([
					item.name,
					item.version || "-",
					item.actionCount,
					item.eventCount,
					(hasLocal ? "(*) " : "") + nodeCount
				]);

			});

			const tableConf = {
				border: _.mapValues(getBorderCharacters("honeywell"), char => chalk.gray(char)),
				columns: {
					1: { alignment: "right" },
					2: { alignment: "right" },
					3: { alignment: "right" },
					4: { alignment: "right" }
				}
			};
			
			console.log(table(data, tableConf));
			done();
		});			

	// List nodes
	vorpal
		.command("nodes", "List of nodes")
		.option("-d, --details", "Detailed list")
		.option("-a, --all", "List all (offline) nodes")
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

			nodes.forEach(node => {
				if (!args.options.all && !node.available && Date.now() - node.lastHeartbeatTime > 60 * 1000) return;

				let ip = "?";
				if (node.ipList) {
					if (node.ipList.length == 1) 
						ip = node.ipList[0];
					else if (node.ipList.length > 1)
						ip = node.ipList[0] + `  (+${node.ipList.length - 1})`;
				}

				data.push([
					node.id == broker.nodeID ? chalk.gray(node.id + " (*)") : node.id,
					node.services ? Object.keys(node.services).length : 0,
					node.client.version,
					node.client.type,
					ip,
					node.available ? chalk.bgGreen.black(" ONLINE "):chalk.bgRed.white.bold(" OFFLINE "),
					node.cpu != null ? node.cpu + "%" : "?"
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
				}				
			});

			const tableConf = {
				border: _.mapValues(getBorderCharacters("honeywell"), (char) => {
					return chalk.gray(char);
				}),
				columns: {
					2: { alignment: "right" },
					5: { alignment: "right" }
				}
			};
			
			console.log(table(data, tableConf));

			done();
		});			

	// Broker info
	vorpal
		.command("info", "Information from broker")
		.action((args, done) => {

			const printHeader = (name) => {
				const title = "  " + name + "  ";
				const lines = "=".repeat(title.length);
				console.log(chalk.yellow.bold(lines));
				console.log(chalk.yellow.bold(title));
				console.log(chalk.yellow.bold(lines));
				console.log("");	
			};

			const print = (caption, value) => {
				console.log("   ", _.padEnd(caption, 25) + (value != null ? ": " + chalk.bold(value) : ""));
			};

			const printObject = (obj, level = 0) => {
				const pad = "  ".repeat(level);
				Object.keys(obj).forEach(key => {
					const val = obj[key];
					if (_.isString(val)) {
						print(pad + key, chalk.green("\"" + val + "\""));
					}
					else if (_.isNumber(val)) {
						print(pad + key, chalk.cyan(val));
					}
					else if (_.isBoolean(val)) {
						print(pad + key, chalk.magenta(val));
					}
					else if (_.isBoolean(val)) {
						print(pad + key, chalk.magenta(val));
					}
					else if (_.isArray(val)) {
						print(pad + key, chalk.blue("[" + val.join(", ") + "]"));
					}
					else if (_.isPlainObject(val) && level < 1) {
						print(pad + key);
						printObject(val, level + 1);
					}
				});
			};		

			console.log("");
			const health = broker.getHealthStatus();
			const Gauge = clui.Gauge;
			const total = health.mem.total;
			const free = health.mem.free;
			const used = total - free;
			const human = pretty(free);

			const heapStat = v8.getHeapStatistics();
			const heapUsed = heapStat.used_heap_size; 
			const maxHeap = heapStat.heap_size_limit;

			printHeader("Common information");
			print("CPU", "Arch: " + (os.arch()) + ", Cores: " + (os.cpus().length));
			print("Memory", Gauge(used, total, 20, total * 0.8, human + " free"));
			print("Heap", Gauge(heapUsed, maxHeap, 20, maxHeap * 0.5, pretty(heapUsed)));
			print("OS", (os.platform()) + " (" + (os.type()) + ")");
			print("IP", health.net.ip.join(", "));
			print("Hostname", os.hostname());
			console.log("");
			print("Node", process.version);
			print("Moleculer version", broker.MOLECULER_VERSION);
			console.log("");

			let strategy = broker.options.registry.strategy;
			printHeader("Broker information");
			print("Namespace", broker.namespace || chalk.gray("<None>"));
			print("Node ID", broker.nodeID);
			print("Services", broker.services.length);
			print("Actions", broker.registry.getActionList({ onlyLocal: true }).length);
			print("Events", broker.registry.getEventList({ onlyLocal: true }).length);
			console.log("");
			print("Strategy", strategy ? strategy.name : chalk.gray("<None>"));
			print("Cacher", broker.cacher ? broker.cacher.constructor.name : chalk.gray("<None>"));

			if (broker.transit) {
				print("Nodes", broker.registry.nodes.list(false).length);

				console.log("");
				printHeader("Transport information");
				print("Serializer", broker.serializer ? broker.serializer.constructor.name : chalk.gray("<None>"));
				print("Pending requests", broker.transit.pendingRequests.size);

				if (broker.transit.tx) {
					print("Transporter", broker.transit.tx ? broker.transit.tx.constructor.name : chalk.gray("<None>"));

					print("Packets");
					print("    Sent", broker.transit.stat.packets.sent);
					print("    Received", broker.transit.stat.packets.received);

					console.log("");

					printHeader("Transporter settings");
					if (_.isString(broker.transit.tx.opts))
						print("URL", broker.transit.tx.opts);
					else
						printObject(broker.transit.tx.opts);
				}
			}
			console.log("");

			printHeader("Broker options");
			printObject(broker.options);
			console.log("");

			console.log("");
			done();
		});	

	// Start REPL
	vorpal
		.delimiter("mol $")
		.show();

}

module.exports = REPL;