import * as assert from "assert";
import { createHash } from "node:crypto";
import { verifyDigest } from "../src/remote/activitypub/misc/verify-digest.js";

describe("ActivityPub digest verification", () => {
	const body = '{\n "content": "こんにちは 🐈"\n}\n';
	const digest = `SHA-256=${createHash("sha256").update(body).digest("base64")}`;

	it("accepts a matching SHA-256 digest", () => {
		assert.strictEqual(verifyDigest(body, digest), true);
	});

	it("accepts a case-insensitive algorithm name", () => {
		assert.strictEqual(
			verifyDigest(body, digest.replace("SHA-256", "sha-256")),
			true,
		);
	});

	it("rejects a modified body", () => {
		assert.strictEqual(
			verifyDigest(body.replace("こんにちは", "modified"), digest),
			false,
		);
	});

	it("rejects whitespace changes even when the JSON is equivalent", () => {
		assert.strictEqual(
			verifyDigest(JSON.stringify(JSON.parse(body)), digest),
			false,
		);
	});

	it("rejects a missing raw body", () => {
		assert.strictEqual(verifyDigest(undefined, digest), false);
	});

	for (const invalidDigest of [
		undefined,
		"",
		"SHA-256=invalid",
		"SHA-512=invalid",
	]) {
		it(`rejects an invalid digest: ${invalidDigest}`, () => {
			assert.strictEqual(verifyDigest(body, invalidDigest), false);
		});
	}
});
