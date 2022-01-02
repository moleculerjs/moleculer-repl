"use strict";

const parse = require("yargs-parser");
const kleur = require("kleur");
const _ = require("lodash");
const { table, getBorderCharacters } = require("table");

function labelsToStr(labels) {
	const keys = Object.keys(labels);
	if (keys.length == 0) return kleur.gray("{}");

	return (
		kleur.gray("{") +
		keys
			.map(
				(key) =>
					`${kleur.gray(key)}: ${kleur.magenta("" + labels[key])}`
			)
			.join(", ") +
		kleur.gray("}")
	);
}

/**
 * Command logic
 * @param {import("moleculer").ServiceBroker} broker Moleculer's Service Broker
 * @param {Object} args Parsed arguments
 */
async function handler(broker, args) {
	if (!broker.isMetricsEnabled()) {
		console.error(kleur.red().bold("Metrics feature is disabled."));
		return;
	}

	const snapshot = broker.metrics.list({ includes: args.options.filter });

	const getMetricValue = function (metric, item) {
		if (metric.type == "histogram") {
			// Histogram
			return ["min", "mean", "max"]
				.map(
					(key) =>
						`${kleur.gray(key)}: ${kleur
							.green()
							.bold("" + Number(item[key]).toFixed(2))}`
				)
				.join(", ");
		}
		if (_.isString(item.value))
			return kleur.yellow().bold(`"${item.value}"`);
		return kleur.green().bold(item.value);
	};

	const data = [
		[
			kleur.bold("Name"),
			kleur.bold("Type"),
			kleur.bold("Labels"),
			kleur.bold("Value"),
		],
	];

	let hLines = [];

	snapshot.sort((a, b) => a.name.localeCompare(b.name));

	snapshot.forEach((metric) => {
		if (metric.values.size == 0) {
			data.push([
				metric.name,
				metric.type,
				"-",
				kleur.gray("<no values>"),
			]);
			return;
		}

		metric.values.forEach((item) => {
			const labelStr = labelsToStr(item.labels);
			data.push([
				metric.name,
				metric.type,
				labelStr,
				getMetricValue(metric, item),
			]);
		});
		hLines.push(data.length);
	});

	const tableConf = {
		border: _.mapValues(getBorderCharacters("honeywell"), (char) =>
			kleur.gray(char)
		),
		columns: {},
		drawHorizontalLine: (index, count) =>
			index == 0 ||
			index == 1 ||
			index == count ||
			hLines.indexOf(index) !== -1,
	};

	console.log(table(data, tableConf));
}

/**
 * Command option declarations
 * @param {import("commander").Command} program Commander
 * @param {import("moleculer").ServiceBroker} broker Moleculer's Service Broker
 */
function declaration(program, broker) {
	program
		.command("metrics")
		.description("List metrics")
		.option("-f, --filter <match>", "filter metrics (e.g.: 'moleculer.**')")
		.hook("preAction", (thisCommand) => {
			// Parse the args that commander.js managed to process
			let parsedArgs = { ...thisCommand._optionValues };
			delete parsedArgs._;

			// Set the params
			thisCommand.params = {
				options: parsedArgs,
				rawCommand: thisCommand.args.join(" "),
			};
		})
		.action(async function () {
			// Get the params
			await handler(broker, this.params);

			// Clear the parsed values for next execution
			this._optionValues = {};
		});
}

module.exports = { declaration, handler };