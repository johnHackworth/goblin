import * as assert from "assert";
import { gcd } from "../../src/prelude/math.js";

describe("prelude/math", () => {
	describe("gcd", () => {
		it("returns greatest common divisor", () => {
			assert.strictEqual(gcd(48, 18), 6);
		});

		it("handles coprime numbers", () => {
			assert.strictEqual(gcd(7, 13), 1);
		});

		it("handles when one number is 0", () => {
			assert.strictEqual(gcd(5, 0), 5);
			assert.strictEqual(gcd(0, 5), 5);
		});

		it("handles same numbers", () => {
			assert.strictEqual(gcd(10, 10), 10);
		});

		it("handles large numbers", () => {
			assert.strictEqual(gcd(100, 25), 25);
		});
	});
});
