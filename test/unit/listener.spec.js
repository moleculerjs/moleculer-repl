"use strict";

import { vi, describe, it, expect, beforeAll, afterEach } from "vitest";

const { ServiceBroker } = require("moleculer");
const commander = require("commander");
const { parseArgsStringToArgv } = require("string-argv");

// Load the command declaration
let { declaration } = require("../../src/commands/listener");

describe("Test 'listener add' command", () => {
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
		declaration(program, broker, cmdHandler, undefined, undefined);
	});

	afterEach(() => {
		cmdHandler.mockClear();
	});

	it("should call 'listener add' with group flag", async () => {
		const command = "listener add user.created --group abcd";

		await program.parseAsync(parseArgsStringToArgv(command, "node", "REPL"));

		expect(cmdHandler).toHaveBeenCalledTimes(1);
		expect(cmdHandler).toHaveBeenCalledWith(expect.any(ServiceBroker), {
			options: {
				group: "abcd"
			},
			eventName: "user.created",
			rawCommand: "listener add user.created --group abcd"
		});
	});
});

describe("Test 'listener remove' command", () => {
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
		declaration(program, broker, undefined, cmdHandler, undefined);
	});

	afterEach(() => {
		cmdHandler.mockClear();
	});

	it("should call 'listener remove'", async () => {
		const command = "listener remove user.created";

		await program.parseAsync(parseArgsStringToArgv(command, "node", "REPL"));

		expect(cmdHandler).toHaveBeenCalledTimes(1);
		expect(cmdHandler).toHaveBeenCalledWith(expect.any(ServiceBroker), {
			options: {},
			eventName: "user.created",
			rawCommand: "listener remove user.created"
		});
	});
});

describe("Test 'listener list' command", () => {
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
		declaration(program, broker, undefined, undefined, cmdHandler);
	});

	afterEach(() => {
		cmdHandler.mockClear();
	});

	it("should call 'listener list'", async () => {
		const command = "listener list";

		await program.parseAsync(parseArgsStringToArgv(command, "node", "REPL"));

		expect(cmdHandler).toHaveBeenCalledTimes(1);
		expect(cmdHandler).toHaveBeenCalledWith(expect.any(ServiceBroker), {
			options: {},
			rawCommand: "listener list"
		});
	});
});
