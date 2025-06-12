import { vi, describe, it, expect, beforeAll, afterAll } from "vitest";
import { execa } from "execa";
import Stream from "node:stream";

describe("E2E test", () => {
	const rs = new Stream.Readable({ read() {} });
	let stdout = "";
	beforeAll(async () => {
		new Promise(async () => {
			for await (const line of execa({
				input: rs
			})`node test/e2e/broker.js`) {
				console.log(line);
				stdout += line + "\n";
			}
		});
	});

	afterAll(() => {
		console.log("STDOUT:\n", stdout);
	});

	async function waitFor(condition) {
		if (typeof condition === "string") {
			condition = [condition];
		}
		for (const cond of condition) {
			console.log(`Waiting for: ${cond}`);
			await vi.waitFor(
				() => {
					return stdout.includes(cond) || Promise.reject(new Error());
				},
				{
					timeout: 5000,
					interval: 500
				}
			);
		}
		stdout = "";
	}

	it("wait for broker start", async () => {
		await waitFor("ServiceBroker with 2 service(s) started successfully");
		expect(true).toBe(true);
	});

	//   actions [options]                                          List of actions
	it("test `actions`", async () => {
		rs.push("actions\n");
		await waitFor("greeter.welcome");
		expect(true).toBe(true);
	});

	// TODO: bench [options] <action> [jsonParams] [meta]               Benchmark service action

	// broadcast <eventName>                                      Broadcast an event
	it("test `broadcast`", async () => {
		rs.push("broadcast test.event\n");
		await waitFor(
			'Event received: test.event, type: broadcastLocal, groups: undefined, params: {}, meta: {"$repl":true}'
		);
		expect(true).toBe(true);
	});

	// TODO: broadcastLocal <eventName>                                 Broadcast an event locally
	// TODO: cache                                                      Manage cache
	// TODO: call [options] <actionName> [jsonParams] [meta]            Call an action
	// TODO: dcall [options] <nodeID> <actionName> [jsonParams] [meta]  Direct call an action
	// TODO: clear [pattern]                                            Clear cache entries
	// TODO: cls                                                        Clear console
	// TODO: destroy <serviceName>                                      Destroy a local service
	// TODO: emit <eventName>                                           Emit an event
	// TODO: env                                                        List of environment variables
	// TODO: events [options]                                           List of event listeners
	// TODO: info                                                       Information about broker
	// TODO: listener                                                   Adds or removes event listeners
	// TODO: load <servicePath>                                         Load a service from file
	// TODO: loadFolder <serviceFolder> [fileMask]                      Load all services from folder
	// TODO: metrics [options]                                          List metrics
	// TODO: nodes [options]                                            List of nodes
	// TODO: exit|q                                                     Exit application
	// TODO: services [options]                                         List of services
	// TODO: hello|hi [options] <name>                                  Call the greeter.hello service with name
	// TODO: help [command]                                             display help for command
});
