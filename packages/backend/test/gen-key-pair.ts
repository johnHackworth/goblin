import * as assert from "assert";
import { genRsaKeyPair, genEcKeyPair } from "../src/misc/gen-key-pair.js";

describe("gen-key-pair", () => {
	describe("genRsaKeyPair", () => {
		it("generates RSA key pair", async () => {
			const keypair = await genRsaKeyPair();
			assert.strictEqual(typeof keypair.publicKey, "string");
			assert.strictEqual(typeof keypair.privateKey, "string");
			assert.ok(keypair.publicKey.includes("BEGIN PUBLIC KEY"));
			assert.ok(keypair.privateKey.includes("BEGIN PRIVATE KEY"));
		});

		it("generates RSA key pair with custom modulus length", async () => {
			const keypair = await genRsaKeyPair(4096);
			assert.ok(keypair.publicKey.includes("BEGIN PUBLIC KEY"));
		});
	});

	describe("genEcKeyPair", () => {
		it("generates EC key pair with default curve", async () => {
			const keypair = await genEcKeyPair();
			assert.strictEqual(typeof keypair.publicKey, "string");
			assert.strictEqual(typeof keypair.privateKey, "string");
			assert.ok(keypair.publicKey.includes("BEGIN PUBLIC KEY"));
			assert.ok(keypair.privateKey.includes("BEGIN PRIVATE KEY"));
		});

		it("generates EC key pair with prime256v1 curve", async () => {
			const keypair = await genEcKeyPair("prime256v1");
			assert.ok(keypair.publicKey.includes("BEGIN PUBLIC KEY"));
		});

		it("generates EC key pair with secp384r1 curve", async () => {
			const keypair = await genEcKeyPair("secp384r1");
			assert.ok(keypair.publicKey.includes("BEGIN PUBLIC KEY"));
		});

		it("generates EC key pair with secp521r1 curve", async () => {
			const keypair = await genEcKeyPair("secp521r1");
			assert.ok(keypair.publicKey.includes("BEGIN PUBLIC KEY"));
		});
	});
});
