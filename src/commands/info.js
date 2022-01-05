"use strict";

const kleur = require("kleur");
const _ = require("lodash");
const util = require("util");
const clui = require("clui");
const pretty = require("pretty-bytes");
const os = require("os");

/**
 * Command logic
 * @param {import("moleculer").ServiceBroker} broker Moleculer's Service Broker
 * @param {Object} args Parsed arguments
 */
async function handler(broker, args) {
	const printHeader = (name) => {
		const title = "  " + name + "  ";
		const lines = "=".repeat(title.length);
		console.log(kleur.yellow().bold(lines));
		console.log(kleur.yellow().bold(title));
		console.log(kleur.yellow().bold(lines));
		console.log("");
	};

	const print = (caption, value) => {
		console.log(
			"   ",
			_.padEnd(caption, 25) +
				(value != null ? ": " + kleur.bold(value) : "")
		);
	};

	const printObject = (obj, level = 0) => {
		const pad = "  ".repeat(level);
		Object.keys(obj).forEach((key) => {
			const val = obj[key];
			if (_.isString(val)) {
				print(pad + key, kleur.green(`"${val}"`));
			} else if (_.isNumber(val)) {
				print(pad + key, kleur.cyan(val));
			} else if (_.isBoolean(val)) {
				print(pad + key, kleur.magenta(val));
			} else if (_.isFunction(val)) {
				print(pad + key, kleur.blue(`[Function ${val.name}]`));
			} else if (_.isArray(val)) {
				if (key == "middlewares") {
					print(
						pad + key,
						val
							.map((v) => {
								if (_.isString(v)) return kleur.green(`"${v}"`);
								if (_.isPlainObject(v) || _.isFunction)
									return kleur.green(`"${v.name}"`);
							})
							.join(", ")
					);
				} else if (key == "replCommands") {
					print(
						pad + key,
						val
							.map((v) => {
								if (_.isPlainObject(v))
									return kleur.green(`"${v.command}"`);
							})
							.join(", ")
					);
				} else if (key == "reporter" || key == "exporter") {
					print(
						pad + key,
						val
							.map((v) => {
								if (_.isString(v)) return kleur.green(`"${v}"`);
								if (_.isPlainObject(v))
									return kleur.green(`"${v.type}"`);
							})
							.join(", ")
					);
				} else {
					print(pad + key, kleur.blue("[" + val.join(", ") + "]"));
				}
			} else if (_.isPlainObject(val) && level < 2) {
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
	print("CPU", "Arch: " + os.arch() + ", Cores: " + os.cpus().length);
	print("Memory", Gauge(used, total, 20, total * 0.8, human + " free"));
	print(
		"Heap",
		Gauge(heapUsed, maxHeap, 20, maxHeap * 0.5, pretty(heapUsed))
	);
	print("OS", os.platform() + " (" + os.type() + ")");
	print("IP", health.net.ip.join(", "));
	print("Hostname", os.hostname());
	console.log("");
	print("Node version", process.version);
	print("Moleculer version", broker.MOLECULER_VERSION);
	print("Protocol version", broker.PROTOCOL_VERSION);
	console.log("");
	print("Current time", new Date().toString());
	console.log("");

	let strategy = broker.registry.StrategyFactory;
	printHeader("Broker information");
	print("Namespace", broker.namespace || kleur.gray("<None>"));
	print("Node ID", broker.nodeID);
	print("Services", broker.services.length);
	print("Actions", broker.registry.getActionList({ onlyLocal: true }).length);
	print("Events", broker.registry.getEventList({ onlyLocal: true }).length);
	console.log("");
	print("Strategy", strategy ? strategy.name : kleur.gray("<None>"));
	print(
		"Cacher",
		broker.cacher ? broker.cacher.constructor.name : kleur.gray("<None>")
	);

	if (broker.transit) {
		print("Nodes", broker.registry.nodes.list(false).length);

		console.log("");
		printHeader("Transport information");
		print(
			"Serializer",
			broker.serializer
				? broker.serializer.constructor.name
				: kleur.gray("<None>")
		);
		print("Pending requests", broker.transit.pendingRequests.size);

		if (broker.transit.tx) {
			print(
				"Transporter",
				broker.transit.tx
					? broker.transit.tx.constructor.name
					: kleur.gray("<None>")
			);

			console.log("");

			printHeader("Transporter settings");
			if (!_.isNil(broker.transit.tx.opts)) {
				if (_.isString(broker.transit.tx.opts))
					print("URL", broker.transit.tx.opts);
				else printObject(broker.transit.tx.opts);
			} else {
				print("Not Setting is set!");
			}
		}
	}
	console.log("");

	printHeader("Broker options");
	printObject(broker.options);
	console.log("");

	console.log("");
}

/**
 * Command option declarations
 * @param {import("commander").Command} program Commander
 * @param {import("moleculer").ServiceBroker} broker Moleculer's Service Broker
 * @param {Function} cmdHandler Command handler
 */
function declaration(program, broker, cmdHandler) {
	program
		.command("info")
		.description("Information about broker")
		.hook("preAction", (thisCommand) => {
			// Command without params. Keep for consistency sake
			let parsedArgs = {};

			const rawCommand = thisCommand.parent.rawArgs.slice(2).join(" ");

			// Set the params
			thisCommand.params = {
				options: parsedArgs,
				rawCommand,
			};

			// Clear the parsed values for next execution
			thisCommand._optionValues = {};
		})
		.action(async function () {
			// Get the params
			await cmdHandler(broker, this.params);
		});
}

/**
 * Register the command
 *
 * @param {import("commander").Command} program Commander
 * @param {import("moleculer").ServiceBroker} broker Moleculer's Service Broker
 */
function register(program, broker) {
	declaration(program, broker, handler);
}

module.exports = { register, declaration, handler };
