"use strict";

import { vi, describe, it, expect, beforeAll, afterEach } from "vitest";

const { ServiceBroker } = require("moleculer");
const commander = require("commander");
const { parseArgsStringToArgv } = require("string-argv");

// Load the command declaration
let { declaration } = require("../src/commands/bench");

describe("Test 'bench' command", () => {
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

	it("should call 'bench' with flags", async () => {
		const command = "bench --time 30 greeter.welcome --num 5 --nodeID abcd";

		await program.parseAsync(parseArgsStringToArgv(command, "node", "REPL"));

		expect(cmdHandler).toHaveBeenCalledTimes(1);
		expect(cmdHandler).toHaveBeenCalledWith(expect.any(ServiceBroker), {
			options: { num: 5, time: 30, nodeID: "abcd" },
			action: "greeter.welcome",
			rawCommand: "bench --time 30 greeter.welcome --num 5 --nodeID abcd"
		});
	});
});
