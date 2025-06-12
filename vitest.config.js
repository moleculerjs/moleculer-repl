import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		coverage: {
			provider: "v8",
			reporter: ["text", "json", "html"],
			reportsDirectory: "./coverage",
			all: true,
			clean: true,
			include: ["src/**/*.js"],
			exclude: ["node_modules/", "src/**/*.test.js"]
		}
	}
});
