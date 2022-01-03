"use strict";

const { ServiceBroker } = require("moleculer");
const commander = require("commander");
const { parseArgsStringToArgv } = require("string-argv");

// Load the command declaration
let { declaration } = require("../src/commands/call");

describe("Test 'call' command", () => {
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
	});

	afterEach(() => {
		cmdHandler.mockClear();
	});

	describe("Test 'call' command", () => {
		it("call", async () => {
			// Register the command
			declaration(program, broker, cmdHandler);

			const command =
				"call greeter.hello --a 5 --b Bob --c --no-d --e.f hello";

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
				actionName: "greeter.hello",
				rawCommand:
					"greeter.hello --a 5 --b Bob --c --no-d --e.f hello",
			});
		});
	});
});
