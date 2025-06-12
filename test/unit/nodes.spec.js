"use strict";

import { vi, describe, it, expect, beforeAll, afterEach } from "vitest";

const { ServiceBroker } = require("moleculer");
const commander = require("commander");
const { parseArgsStringToArgv } = require("string-argv");

// Load the command declaration
let { declaration } = require("../../src/commands/nodes");

describe("Test 'nodes' command", () => {
	let program;
	let broker;

	// Mock the handler
	const cmdHandler = vi.fn();

	beforeAll(() => {
		program = new commander.Command();
		program.exitOverride();
		program.allowUnknownOption(true);

		program.showHelpAfterError(true);
		program.showSuggestionAfterError(true);

		// Create broker
		broker = new ServiceBroker({
			nodeID: "repl-" + process.pid,
			logger: false
		});

		// Register the command
		declaration(program, broker, cmdHandler);
	});

	afterEach(() => {
		cmdHandler.mockClear();
	});

	it("should call 'nodes' with flags", async () => {
		const command = "nodes -a -d --raw --filter node-* --save abc.json";

		await program.parseAsync(parseArgsStringToArgv(command, "node", "REPL"));

		expect(cmdHandler).toHaveBeenCalledTimes(1);
		expect(cmdHandler).toHaveBeenCalledWith(expect.any(ServiceBroker), {
			options: {
				all: true,
				details: true,
				filter: "node-*",
				raw: true,
				save: "abc.json"
			},
			rawCommand: "nodes -a -d --raw --filter node-* --save abc.json"
		});
	});
});
