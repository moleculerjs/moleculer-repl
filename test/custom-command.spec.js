"use strict";

import { vi, describe, it, expect, beforeAll, afterEach, afterAll } from "vitest";

const { ServiceBroker } = require("moleculer");
const REPL = require("../src");

describe("Test custom commands", () => {
	const broker = new ServiceBroker({
		logger: false
	});

	// Mock the handler
	const cmdHandler = vi.fn();

	const replServer = REPL(broker, {
		customCommands: [
			{
				command: "hello <name>",
				description: "Call the greeter.hello service with name",
				alias: ["hi"],
				options: [
					{
						option: "-u, --uppercase",
						description: "Uppercase the name"
					},
					{
						option: "-p, --prefix <prefix>",
						description: "Add prefix to the name"
					}
				],
				types: {
					string: ["name"],
					boolean: ["u", "uppercase"]
				},
				allowUnknownOptions: true,
				action: cmdHandler
			}
		]
	});

	// Disable exit event listeners
	// Allows Jest to properly exit the test
	replServer._events.exit = [];

	beforeAll(async () => {
		await broker.start();
	});

	afterAll(async () => {
		await broker.stop();
		replServer.close();
	});

	afterEach(() => {
		cmdHandler.mockReset();
	});

	it("should call 'hello' with flags", async () => {
		expect(true).toBe(true);

		const callbackMock = vi.fn();
		replServer.eval("hello -u --prefix Mr. test", undefined, undefined, callbackMock);

		expect(cmdHandler).toHaveBeenCalledTimes(1);
		expect(cmdHandler).toHaveBeenCalledWith(
			expect.any(ServiceBroker),
			{
				options: {
					uppercase: true,
					prefix: "Mr."
				},
				name: "test",
				rawCommand: "hello -u --prefix Mr. test"
			},
			expect.any(Object)
		);
	});

	it("should call with 'hi' as alias with flags", async () => {
		expect(true).toBe(true);

		const callbackMock = vi.fn();
		replServer.eval("hi -u --prefix Mr. test", undefined, undefined, callbackMock);

		expect(cmdHandler).toHaveBeenCalledTimes(1);
		expect(cmdHandler).toHaveBeenCalledWith(
			expect.any(ServiceBroker),
			{
				options: {
					uppercase: true,
					prefix: "Mr."
				},
				name: "test",
				rawCommand: "hi -u --prefix Mr. test"
			},
			expect.any(Object)
		);
	});
});
