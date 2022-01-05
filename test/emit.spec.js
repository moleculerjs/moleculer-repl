"use strict";

const { ServiceBroker } = require("moleculer");
const commander = require("commander");
const { parseArgsStringToArgv } = require("string-argv");

// Load the command declaration
let { declaration } = require("../src/commands/emit");

describe("Test 'emit' command", () => {
	let program;
	let broker;

	// Mock the handler
	const cmdHandler = jest.fn();

	beforeAll(() => {
		program = new commander.Command();
		program.exitOverride();
		program.allowUnknownOption(true);

		program.showHelpAfterError(true);
		program.showSuggestionAfterError(true);

		// Create broker
		broker = new ServiceBroker({
			nodeID: "repl-" + process.pid,
			logger: false,
		});

		// Register the command
		declaration(program, broker, cmdHandler);
	});

	afterEach(() => {
		cmdHandler.mockClear();
	});

	it("should 'emit' with simple and nested params", async () => {
		const command =
			'emit "user.created" --a 5 --b Bob --c --no-d --e.f "hello"';

		await program.parseAsync(
			parseArgsStringToArgv(command, "node", "REPL")
		);

		expect(cmdHandler).toHaveBeenCalledTimes(1);
		expect(cmdHandler).toHaveBeenCalledWith(expect.any(ServiceBroker), {
			options: {
				a: 5,
				b: "Bob",
				c: true,
				d: false,
				e: { f: "hello" },
			},
			eventName: "user.created",
			rawCommand:
				"emit user.created --a 5 --b Bob --c --no-d --e.f hello",
		});
	});

	it("should 'emit' with arrays", async () => {
		const command = "emit greeter.hello --a 5 --a 6 --b 8 --b 12";

		await program.parseAsync(
			parseArgsStringToArgv(command, "node", "REPL")
		);

		expect(cmdHandler).toHaveBeenCalledTimes(1);
		expect(cmdHandler).toHaveBeenCalledWith(expect.any(ServiceBroker), {
			options: {
				a: [5, 6],
				b: [8, 12],
			},
			eventName: "greeter.hello",
			rawCommand: "emit greeter.hello --a 5 --a 6 --b 8 --b 12",
		});
	});

	it("should 'emit' NOT parse the values", async () => {
		// example from: https://github.com/moleculerjs/moleculer-repl/issues/54

		const command = 'emit user.create --phone "+1111111" --passcode "0033"';

		await program.parseAsync(
			parseArgsStringToArgv(command, "node", "REPL")
		);

		expect(cmdHandler).toHaveBeenCalledTimes(1);
		expect(cmdHandler).toHaveBeenCalledWith(expect.any(ServiceBroker), {
			options: { phone: "+1111111", passcode: "0033" },
			eventName: "user.create",
			rawCommand: "emit user.create --phone +1111111 --passcode 0033",
		});
	});

	it("should 'emit' keep hexadecimals as string", async () => {
		// example adapted from: https://github.com/moleculerjs/moleculer-repl/issues/47

		const command =
			"emit greeter.hello --a 5 --a 6 --hash 0x7597 --b 8 --b 12 --traceHash 0xab706 --c testString";

		await program.parseAsync(
			parseArgsStringToArgv(command, "node", "REPL")
		);

		expect(cmdHandler).toHaveBeenCalledTimes(1);
		expect(cmdHandler).toHaveBeenCalledWith(expect.any(ServiceBroker), {
			options: {
				a: [5, 6],
				b: [8, 12],
				c: "testString",
				hash: "0x7597",
				traceHash: "0xab706",
			},
			eventName: "greeter.hello",
			rawCommand:
				"emit greeter.hello --a 5 --a 6 --hash 0x7597 --b 8 --b 12 --traceHash 0xab706 --c testString",
		});
	});
});
