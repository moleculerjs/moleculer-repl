"use strict";

const { ServiceBroker } = require("moleculer");
const commander = require("commander");
const { parseArgsStringToArgv } = require("string-argv");

describe("Test commands", () => {
	let program;
	let broker;

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

	describe("Test 'call' command", () => {
		// Load the command declaration
		let registerCommand = require("../src/test/call");

		it("call", async () => {
			// Register the command
			registerCommand(program, broker);

			// Mock the handler
			program.commands[0]._actionHandler = jest.fn();

			const command =
				"call greeter.hello  --a 5 --b Bob --c --no-d --e.f hello";

			await program.parseAsync(
				parseArgsStringToArgv(command, "node", "REPL")
			);

			expect(program.commands[0].params).toStrictEqual({
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
