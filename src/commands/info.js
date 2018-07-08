"use strict";

const chalk 			= require("chalk");
const _ 				= require("lodash");
const util 				= require("util");
const clui 				= require("clui");
const pretty 			= require("pretty-bytes");
const os 				= require("os");

module.exports = function(vorpal, broker) {
	// Broker info
	vorpal
		.command("info", "Information about broker")
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

			const v8 = require("v8");
			const heapStat = v8.getHeapStatistics();
			const heapUsed = heapStat.used_heap_size;
			const maxHeap = heapStat.heap_size_limit;

			printHeader("General information");
			print("CPU", "Arch: " + (os.arch()) + ", Cores: " + (os.cpus().length));
			print("Memory", Gauge(used, total, 20, total * 0.8, human + " free"));
			print("Heap", Gauge(heapUsed, maxHeap, 20, maxHeap * 0.5, pretty(heapUsed)));
			print("OS", (os.platform()) + " (" + (os.type()) + ")");
			print("IP", health.net.ip.join(", "));
			print("Hostname", os.hostname());
			console.log("");
			print("Node version", process.version);
			print("Moleculer version", broker.MOLECULER_VERSION);
			print("Protocol version", broker.PROTOCOL_VERSION);
			console.log("");
			print("Current time", new Date().toString());
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
					print("    Sent", util.inspect(broker.transit.stat.packets.sent, { breakLength: Infinity }));
					print("    Received", util.inspect(broker.transit.stat.packets.received, { breakLength: Infinity }));

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
};
