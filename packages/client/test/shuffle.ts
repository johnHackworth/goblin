import * as assert from "assert";
import { shuffle } from "../src/scripts/shuffle";

describe("shuffle", () => {
	it("should return the same array reference", () => {
		const arr = [1, 2, 3, 4, 5];
		const result = shuffle(arr);
		assert.strictEqual(result, arr);
	});

	it("should contain all original elements", () => {
		const arr = [1, 2, 3, 4, 5];
		const result = shuffle([...arr]);
		assert.deepStrictEqual(result.sort(), arr.sort());
	});

	it("should handle empty array", () => {
		const arr: number[] = [];
		const result = shuffle([...arr]);
		assert.deepStrictEqual(result, []);
	});

	it("should handle single element", () => {
		const arr = [1];
		const result = shuffle([...arr]);
		assert.deepStrictEqual(result, [1]);
	});

	it("should handle two elements", () => {
		const arr = [1, 2];
		const result = shuffle([...arr]);
		assert.deepStrictEqual(result.sort(), [1, 2]);
	});
});
