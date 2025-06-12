"use strict";

import { vi, describe, it, expect, beforeAll, afterEach } from "vitest";

const { ServiceBroker } = require("moleculer");
const commander = require("commander");
const { parseArgsStringToArgv } = require("string-argv");

// Load the command declaration
let { declaration } = require("../src/commands/broadcast");

describe("Test 'broadcast' command", () => {
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

	it("should call 'broadcast' with simple and nested params", async () => {
		const command = 'broadcast "user.created" --a 5 --b Bob --c --no-d --e.f "hello"';

		await program.parseAsync(parseArgsStringToArgv(command, "node", "REPL"));

		expect(cmdHandler).toHaveBeenCalledTimes(1);
		expect(cmdHandler).toHaveBeenCalledWith(
			expect.any(ServiceBroker),
			{
				options: {
					a: 5,
					b: "Bob",
					c: true,
					d: false,
					e: { f: "hello" }
				},
				eventName: "user.created",
				rawCommand: "broadcast user.created --a 5 --b Bob --c --no-d --e.f hello"
			},
			"broadcast",
			"with payload"
		);
	});

	it("should call 'broadcast' with arrays", async () => {
		const command = "broadcast greeter.hello --a 5 --a 6 --b 8 --b 12";

		await program.parseAsync(parseArgsStringToArgv(command, "node", "REPL"));

		expect(cmdHandler).toHaveBeenCalledTimes(1);
		expect(cmdHandler).toHaveBeenCalledWith(
			expect.any(ServiceBroker),
			{
				options: {
					a: [5, 6],
					b: [8, 12]
				},
				eventName: "greeter.hello",
				rawCommand: "broadcast greeter.hello --a 5 --a 6 --b 8 --b 12"
			},
			"broadcast",
			"with payload"
		);
	});

	it("should call 'broadcast' and NOT parse the values", async () => {
		// example from: https://github.com/moleculerjs/moleculer-repl/issues/54

		const command = 'broadcast user.create --phone "+1111111" --passcode "0033"';

		await program.parseAsync(parseArgsStringToArgv(command, "node", "REPL"));

		expect(cmdHandler).toHaveBeenCalledTimes(1);
		expect(cmdHandler).toHaveBeenCalledWith(
			expect.any(ServiceBroker),
			{
				options: { phone: "+1111111", passcode: "0033" },
				eventName: "user.create",
				rawCommand: "broadcast user.create --phone +1111111 --passcode 0033"
			},
			"broadcast",
			"with payload"
		);
	});

	it("should call 'broadcast' and keep hexadecimals as string", async () => {
		// example adapted from: https://github.com/moleculerjs/moleculer-repl/issues/47

		const command =
			"broadcast greeter.hello --a 5 --a 6 --hash 0x7597 --b 8 --b 12 --traceHash 0xab706 --c testString";

		await program.parseAsync(parseArgsStringToArgv(command, "node", "REPL"));

		expect(cmdHandler).toHaveBeenCalledTimes(1);
		expect(cmdHandler).toHaveBeenCalledWith(
			expect.any(ServiceBroker),
			{
				options: {
					a: [5, 6],
					b: [8, 12],
					c: "testString",
					hash: "0x7597",
					traceHash: "0xab706"
				},
				eventName: "greeter.hello",
				rawCommand:
					"broadcast greeter.hello --a 5 --a 6 --hash 0x7597 --b 8 --b 12 --traceHash 0xab706 --c testString"
			},
			"broadcast",
			"with payload"
		);
	});
});

describe("Test 'broadcastLocal' command", () => {
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

	it("should call 'broadcastLocal' with simple and nested params", async () => {
		const command = 'broadcastLocal "user.created" --a 5 --b Bob --c --no-d --e.f "hello"';

		await program.parseAsync(parseArgsStringToArgv(command, "node", "REPL"));

		expect(cmdHandler).toHaveBeenCalledTimes(1);
		expect(cmdHandler).toHaveBeenCalledWith(
			expect.any(ServiceBroker),
			{
				options: {
					a: 5,
					b: "Bob",
					c: true,
					d: false,
					e: { f: "hello" }
				},
				eventName: "user.created",
				rawCommand: "broadcastLocal user.created --a 5 --b Bob --c --no-d --e.f hello"
			},
			"broadcast",
			"locally with payload"
		);
	});

	it("should call 'broadcastLocal' with arrays", async () => {
		const command = "broadcastLocal greeter.hello --a 5 --a 6 --b 8 --b 12";

		await program.parseAsync(parseArgsStringToArgv(command, "node", "REPL"));

		expect(cmdHandler).toHaveBeenCalledTimes(1);
		expect(cmdHandler).toHaveBeenCalledWith(
			expect.any(ServiceBroker),
			{
				options: {
					a: [5, 6],
					b: [8, 12]
				},
				eventName: "greeter.hello",
				rawCommand: "broadcastLocal greeter.hello --a 5 --a 6 --b 8 --b 12"
			},
			"broadcast",
			"locally with payload"
		);
	});

	it("should call 'broadcastLocal' and NOT parse the values", async () => {
		// example from: https://github.com/moleculerjs/moleculer-repl/issues/54

		const command = 'broadcastLocal user.create --phone "+1111111" --passcode "0033"';

		await program.parseAsync(parseArgsStringToArgv(command, "node", "REPL"));

		expect(cmdHandler).toHaveBeenCalledTimes(1);
		expect(cmdHandler).toHaveBeenCalledWith(
			expect.any(ServiceBroker),
			{
				options: { phone: "+1111111", passcode: "0033" },
				eventName: "user.create",
				rawCommand: "broadcastLocal user.create --phone +1111111 --passcode 0033"
			},
			"broadcast",
			"locally with payload"
		);
	});

	it("should call 'broadcastLocal' and keep hexadecimals as string", async () => {
		// example adapted from: https://github.com/moleculerjs/moleculer-repl/issues/47

		const command =
			"broadcastLocal greeter.hello --a 5 --a 6 --hash 0x7597 --b 8 --b 12 --traceHash 0xab706 --c testString";

		await program.parseAsync(parseArgsStringToArgv(command, "node", "REPL"));

		expect(cmdHandler).toHaveBeenCalledTimes(1);
		expect(cmdHandler).toHaveBeenCalledWith(
			expect.any(ServiceBroker),
			{
				options: {
					a: [5, 6],
					b: [8, 12],
					c: "testString",
					hash: "0x7597",
					traceHash: "0xab706"
				},
				eventName: "greeter.hello",
				rawCommand:
					"broadcastLocal greeter.hello --a 5 --a 6 --hash 0x7597 --b 8 --b 12 --traceHash 0xab706 --c testString"
			},
			"broadcast",
			"locally with payload"
		);
	});
});
