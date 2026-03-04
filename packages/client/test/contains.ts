import * as assert from "assert";
import contains from "../src/scripts/contains";

describe("contains", () => {
	let parent: HTMLElement;
	let child: HTMLElement;
	let grandchild: HTMLElement;

	beforeEach(() => {
		parent = document.createElement("div");
		child = document.createElement("div");
		grandchild = document.createElement("div");
		parent.appendChild(child);
		child.appendChild(grandchild);
	});

	it("should return true if parent contains child", () => {
		assert.strictEqual(contains(parent, child), true);
	});

	it("should return true if parent contains grandchild", () => {
		assert.strictEqual(contains(parent, grandchild), true);
	});

	it("should return true if element contains itself with checkSame true", () => {
		assert.strictEqual(contains(parent, parent, true), true);
	});

	it("should return false if element contains itself with checkSame false", () => {
		assert.strictEqual(contains(parent, parent, false), false);
	});

	it("should return false if parent does not contain unrelated element", () => {
		const unrelated = document.createElement("div");
		assert.strictEqual(contains(parent, unrelated), false);
	});

	it("should return false for child containing parent", () => {
		assert.strictEqual(contains(child, parent), false);
	});
});
