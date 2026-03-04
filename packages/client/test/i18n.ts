import * as assert from "assert";
import { I18n } from "../src/scripts/i18n";

describe("I18n", () => {
	const locale = {
		hello: "Hello",
		greeting: {
			morning: "Good morning",
			evening: "Good evening",
		},
		name: "Hello, {name}!",
		count: "You have {count} items",
	};

	let i18n: I18n<typeof locale>;

	beforeEach(() => {
		i18n = new I18n(locale);
	});

	it("should return simple string", () => {
		assert.strictEqual(i18n.t("hello"), "Hello");
	});

	it("should return nested string using dot notation", () => {
		assert.strictEqual(i18n.t("greeting.morning"), "Good morning");
		assert.strictEqual(i18n.t("greeting.evening"), "Good evening");
	});

	it("should replace single placeholder", () => {
		assert.strictEqual(i18n.t("name", { name: "World" }), "Hello, World!");
	});

	it("should replace multiple placeholders", () => {
		assert.strictEqual(i18n.t("count", { count: 5 }), "You have 5 items");
	});



	it("should handle numeric placeholders", () => {
		assert.strictEqual(i18n.t("count", { count: 0 }), "You have 0 items");
		assert.strictEqual(i18n.t("count", { count: 100 }), "You have 100 items");
	});
});
