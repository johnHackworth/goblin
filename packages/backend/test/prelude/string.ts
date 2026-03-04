import * as assert from "assert";
import {
	concat,
	capitalize,
	toUpperCase,
	toLowerCase,
} from "../../src/prelude/string.js";

describe("prelude/string", () => {
	describe("concat", () => {
		it("concatenates array of strings", () => {
			assert.strictEqual(concat(["a", "b", "c"]), "abc");
		});

		it("handles empty array", () => {
			assert.strictEqual(concat([]), "");
		});
	});

	describe("capitalize", () => {
		it("capitalizes first letter", () => {
			assert.strictEqual(capitalize("hello"), "Hello");
		});

		it("handles empty string", () => {
			assert.strictEqual(capitalize(""), "");
		});

		it("handles single character", () => {
			assert.strictEqual(capitalize("a"), "A");
		});
	});

	describe("toUpperCase", () => {
		it("converts to uppercase", () => {
			assert.strictEqual(toUpperCase("hello"), "HELLO");
		});
	});

	describe("toLowerCase", () => {
		it("converts to lowercase", () => {
			assert.strictEqual(toLowerCase("HELLO"), "hello");
		});
	});
});
