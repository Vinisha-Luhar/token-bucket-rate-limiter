import {defineConfig} from "vitest/config";

export default defineConfig({
    test: {
        setupFiles: ["./tests/setup.js"],
        testTimeout: 10000,
        hookTimeout: 30000,
        restoreMocks: true
    }
});