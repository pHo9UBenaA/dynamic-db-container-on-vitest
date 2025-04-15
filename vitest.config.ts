import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		include: ["tests/mysql/**/*.test.ts"],
		testTimeout: 100000,
		hookTimeout: 200000,
		isolate: true,
		poolOptions: {
			threads: {
				singleThread: true,
			},
		},
		maxWorkers: 1,
		fileParallelism: false,
	},
});
