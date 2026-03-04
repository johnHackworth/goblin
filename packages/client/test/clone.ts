import * as assert from "assert";
import { deepClone } from "../src/scripts/clone";

describe("deepClone", () => {
	it("should clone a string", () => {
		const original = "hello";
		const result = deepClone(original);
		assert.strictEqual(result, "hello");
	});

	it("should clone a number", () => {
		const original = 42;
		const result = deepClone(original);
		assert.strictEqual(result, 42);
	});

	it("should clone a boolean", () => {
		const original = true;
		const result = deepClone(original);
		assert.strictEqual(result, true);
	});

	it("should clone null", () => {
		const original = null;
		const result = deepClone(original);
		assert.strictEqual(result, null);
	});

	it("should clone an array", () => {
		const original = [1, 2, 3];
		const result = deepClone(original);
		assert.deepStrictEqual(result, [1, 2, 3]);
		assert.notStrictEqual(result, original);
	});

	it("should clone an object", () => {
		const original = { a: 1, b: 2 };
		const result = deepClone(original);
		assert.deepStrictEqual(result, { a: 1, b: 2 });
		assert.notStrictEqual(result, original);
	});

	it("should deeply clone nested objects", () => {
		const original = { a: { b: { c: 1 } } };
		const result = deepClone(original);
		assert.deepStrictEqual(result, { a: { b: { c: 1 } } });
		assert.notStrictEqual(result, original);
		assert.notStrictEqual(result.a, original.a);
		assert.notStrictEqual(result.a.b, original.a.b);
	});

	it("should deeply clone nested arrays", () => {
		const original = [[1, 2], [3, 4]];
		const result = deepClone(original);
		assert.deepStrictEqual(result, [[1, 2], [3, 4]]);
		assert.notStrictEqual(result, original);
		assert.notStrictEqual(result[0], original[0]);
	});

	it("should clone mixed nested structure", () => {
		const original = { arr: [1, { nested: true }], num: 42 };
		const result = deepClone(original);
		assert.deepStrictEqual(result, { arr: [1, { nested: true }], num: 42 });
		assert.notStrictEqual(result.arr, original.arr);
		assert.notStrictEqual(result.arr[1], original.arr[1]);
	});
});
