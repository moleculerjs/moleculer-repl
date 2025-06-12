import { vi, describe, it, expect, beforeAll } from "vitest";
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

	async function waitFor(condition) {
		if (typeof condition === "string") {
			condition = [condition];
		}
		for (const cond of condition) {
			await vi.waitFor(() => stdout.includes(cond) || Promise.reject(new Error()), {
				timeout: 5000
			});
		}
		stdout = "";
	}

	it("wait for broker start", async () => {
		await waitFor("ServiceBroker with 2 service(s) started successfully");
		expect(true).toBe(true);
	});
});
