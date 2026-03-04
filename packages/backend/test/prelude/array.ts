import * as assert from "assert";
import {
	countIf,
	count,
	concat,
	intersperse,
	erase,
	difference,
	unique,
	sum,
	maximum,
	groupBy,
	groupOn,
	groupByX,
	lessThan,
	takeWhile,
	cumulativeSum,
	toArray,
	toSingle,
} from "../../src/prelude/array.js";

describe("prelude/array", () => {
	describe("countIf", () => {
		it("counts elements matching predicate", () => {
			assert.strictEqual(countIf((x: number) => x > 2, [1, 2, 3, 4, 5]), 3);
		});

		it("returns 0 for empty array", () => {
			assert.strictEqual(countIf((x: number) => x > 2, []), 0);
		});
	});

	describe("count", () => {
		it("counts elements equal to value", () => {
			assert.strictEqual(count(2, [1, 2, 2, 3, 2]), 3);
		});

		it("returns 0 when value not found", () => {
			assert.strictEqual(count(5, [1, 2, 3]), 0);
		});
	});

	describe("concat", () => {
		it("concatenates array of arrays", () => {
			assert.deepStrictEqual(concat([[1, 2], [3, 4], [5]]), [1, 2, 3, 4, 5]);
		});

		it("handles empty arrays", () => {
			assert.deepStrictEqual(concat([[], []]), []);
		});
	});

	describe("intersperse", () => {
		it("intersperses element between array elements", () => {
			assert.deepStrictEqual(intersperse(",", ["a", "b", "c"]), [
				"a",
				",",
				"b",
				",",
				"c",
			]);
		});

		it("handles single element", () => {
			assert.deepStrictEqual(intersperse(",", ["a"]), ["a"]);
		});

		it("handles empty array", () => {
			assert.deepStrictEqual(intersperse(",", []), []);
		});
	});

	describe("erase", () => {
		it("removes all occurrences of element", () => {
			assert.deepStrictEqual(erase(2, [1, 2, 3, 2, 4]), [1, 3, 4]);
		});
	});

	describe("difference", () => {
		it("returns elements in first array not in second", () => {
			assert.deepStrictEqual(difference([1, 2, 3, 4], [2, 4]), [1, 3]);
		});

		it("preserves order", () => {
			assert.deepStrictEqual(difference([3, 1, 4, 1, 5], [1]), [3, 4, 5]);
		});
	});

	describe("unique", () => {
		it("removes duplicate elements", () => {
			assert.deepStrictEqual(unique([1, 2, 2, 3, 3, 3]), [1, 2, 3]);
		});
	});

	describe("sum", () => {
		it("sums array of numbers", () => {
			assert.strictEqual(sum([1, 2, 3, 4, 5]), 15);
		});

		it("returns 0 for empty array", () => {
			assert.strictEqual(sum([]), 0);
		});
	});

	describe("maximum", () => {
		it("returns maximum value", () => {
			assert.strictEqual(maximum([3, 1, 4, 1, 5, 9]), 9);
		});
	});

	describe("groupBy", () => {
		it("groups elements by relation", () => {
			assert.deepStrictEqual(groupBy((a: number, b: number) => a === b, [1, 1, 2, 2, 2, 3]), [
				[1, 1],
				[2, 2, 2],
				[3],
			]);
		});
	});

	describe("groupOn", () => {
		it("groups elements by function result", () => {
			// groupOn groups adjacent elements with the same function result using groupBy
			assert.deepStrictEqual(groupOn((x: number) => x < 3, [1, 2, 3, 4, 5]), [
				[1, 2],
				[3, 4, 5],
			]);
		});
	});

	describe("groupByX", () => {
		it("groups by key selector", () => {
			assert.deepStrictEqual(
				groupByX(
					[
						{ type: "a", value: 1 },
						{ type: "b", value: 2 },
						{ type: "a", value: 3 },
					],
					(x: { type: string }) => x.type,
				),
				{
					a: [
						{ type: "a", value: 1 },
						{ type: "a", value: 3 },
					],
					b: [{ type: "b", value: 2 }],
				},
			);
		});
	});

	describe("lessThan", () => {
		it("compares arrays lexicographically", () => {
			assert.strictEqual(lessThan([1, 2], [1, 3]), true);
			assert.strictEqual(lessThan([1, 3], [1, 2]), false);
			assert.strictEqual(lessThan([1], [1, 2]), true);
			assert.strictEqual(lessThan([1, 2], [1]), false);
		});
	});

	describe("takeWhile", () => {
		it("takes elements while predicate is true", () => {
			assert.deepStrictEqual(takeWhile((x: number) => x < 3, [1, 2, 3, 4, 5]), [1, 2]);
		});

		it("returns empty if first element doesn't match", () => {
			assert.deepStrictEqual(takeWhile((x: number) => x < 0, [1, 2, 3]), []);
		});

		it("returns all elements if all match", () => {
			assert.deepStrictEqual(takeWhile((x: number) => x < 10, [1, 2, 3]), [1, 2, 3]);
		});
	});

	describe("cumulativeSum", () => {
		it("calculates cumulative sum", () => {
			assert.deepStrictEqual(cumulativeSum([1, 2, 3, 4]), [1, 3, 6, 10]);
		});

		it("handles single element", () => {
			assert.deepStrictEqual(cumulativeSum([5]), [5]);
		});

		it("handles empty array", () => {
			assert.deepStrictEqual(cumulativeSum([]), []);
		});
	});

	describe("toArray", () => {
		it("wraps single value in array", () => {
			assert.deepStrictEqual(toArray(5), [5]);
		});

		it("returns array as is", () => {
			assert.deepStrictEqual(toArray([1, 2, 3]), [1, 2, 3]);
		});

		it("returns empty array for undefined", () => {
			assert.deepStrictEqual(toArray(undefined), []);
		});
	});

	describe("toSingle", () => {
		it("returns first element of array", () => {
			assert.strictEqual(toSingle([1, 2, 3]), 1);
		});

		it("returns value as is if not array", () => {
			assert.strictEqual(toSingle(5), 5);
		});

		it("returns undefined for undefined", () => {
			assert.strictEqual(toSingle(undefined), undefined);
		});
	});
});
