import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		coverage: {
			provider: "v8",
			reporter: ["text", "json", "html"],
			include: ["src/**/*.js"],
			exclude: ["node_modules/", "test/"],
			all: true,
			reportsDirectory: "./coverage",
			clean: true
		}
	}
});
