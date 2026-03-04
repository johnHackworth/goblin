import * as assert from "assert";
import { alpha } from "../src/scripts/color";

describe("color", () => {
	it("alpha with hash", () => {
		const result = alpha("#ff0000", 0.5);
		assert.strictEqual(result, "rgba(255, 0, 0, 0.5)");
	});

	it("alpha without hash", () => {
		const result = alpha("00ff00", 0.8);
		assert.strictEqual(result, "rgba(0, 255, 0, 0.8)");
	});

	it("alpha with uppercase", () => {
		const result = alpha("#FF0000", 1);
		assert.strictEqual(result, "rgba(255, 0, 0, 1)");
	});

	it("alpha with lowercase", () => {
		const result = alpha("#aabbcc", 0.3);
		assert.strictEqual(result, "rgba(170, 187, 204, 0.3)");
	});
});
