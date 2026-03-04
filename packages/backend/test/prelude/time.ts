import * as assert from "assert";
import {
	dateUTC,
	isTimeSame,
	isTimeBefore,
	isTimeAfter,
	addTime,
	subtractTime,
} from "../../src/prelude/time.js";

describe("prelude/time", () => {
	describe("dateUTC", () => {
		it("creates date from year and month", () => {
			const d = dateUTC([2000, 0]);
			assert.deepStrictEqual(d.getUTCFullYear(), 2000);
			assert.deepStrictEqual(d.getUTCMonth(), 0);
		});

		it("creates date from year, month, and day", () => {
			const d = dateUTC([2000, 0, 15]);
			assert.deepStrictEqual(d.getUTCDate(), 15);
		});

		it("creates date from year, month, day, hour", () => {
			const d = dateUTC([2000, 0, 15, 12]);
			assert.deepStrictEqual(d.getUTCHours(), 12);
		});

		it("creates date from year, month, day, hour, minute", () => {
			const d = dateUTC([2000, 0, 15, 12, 30]);
			assert.deepStrictEqual(d.getUTCMinutes(), 30);
		});

		it("creates date from year, month, day, hour, minute, second", () => {
			const d = dateUTC([2000, 0, 15, 12, 30, 45]);
			assert.deepStrictEqual(d.getUTCSeconds(), 45);
		});

		it("creates date from year, month, day, hour, minute, second, millisecond", () => {
			const d = dateUTC([2000, 0, 15, 12, 30, 45, 500]);
			assert.deepStrictEqual(d.getUTCMilliseconds(), 500);
		});

		it("throws on wrong number of arguments", () => {
			assert.throws(() => dateUTC([]));
		});
	});

	describe("isTimeSame", () => {
		it("returns true for same time", () => {
			const a = new Date(2000, 0, 1);
			const b = new Date(2000, 0, 1);
			assert.strictEqual(isTimeSame(a, b), true);
		});

		it("returns false for different times", () => {
			const a = new Date(2000, 0, 1);
			const b = new Date(2000, 0, 2);
			assert.strictEqual(isTimeSame(a, b), false);
		});
	});

	describe("isTimeBefore", () => {
		it("returns true when a is before b", () => {
			const a = new Date(2000, 0, 1);
			const b = new Date(2000, 0, 2);
			assert.strictEqual(isTimeBefore(a, b), true);
		});

		it("returns false when a is after b", () => {
			const a = new Date(2000, 0, 2);
			const b = new Date(2000, 0, 1);
			assert.strictEqual(isTimeBefore(a, b), false);
		});
	});

	describe("isTimeAfter", () => {
		it("returns true when a is after b", () => {
			const a = new Date(2000, 0, 2);
			const b = new Date(2000, 0, 1);
			assert.strictEqual(isTimeAfter(a, b), true);
		});

		it("returns false when a is before b", () => {
			const a = new Date(2000, 0, 1);
			const b = new Date(2000, 0, 2);
			assert.strictEqual(isTimeAfter(a, b), false);
		});
	});

	describe("addTime", () => {
		it("adds milliseconds by default", () => {
			const d = new Date(2000, 0, 1, 0, 0, 0);
			const result = addTime(d, 1000);
			assert.strictEqual(result.getTime(), d.getTime() + 1000);
		});

		it("adds hours", () => {
			const d = new Date(2000, 0, 1, 0, 0, 0);
			const result = addTime(d, 2, "hour");
			assert.strictEqual(result.getHours(), 2);
		});

		it("adds days", () => {
			const d = new Date(2000, 0, 1, 0, 0, 0);
			const result = addTime(d, 5, "day");
			assert.strictEqual(result.getDate(), 6);
		});
	});

	describe("subtractTime", () => {
		it("subtracts milliseconds by default", () => {
			const d = new Date(2000, 0, 1, 0, 0, 1);
			const result = subtractTime(d, 1000);
			assert.strictEqual(result.getTime(), d.getTime() - 1000);
		});

		it("subtracts hours", () => {
			const d = new Date(2000, 0, 1, 2, 0, 0);
			const result = subtractTime(d, 2, "hour");
			assert.strictEqual(result.getHours(), 0);
		});

		it("subtracts days", () => {
			const d = new Date(2000, 0, 5, 0, 0, 0);
			const result = subtractTime(d, 3, "day");
			assert.strictEqual(result.getDate(), 2);
		});
	});
});
