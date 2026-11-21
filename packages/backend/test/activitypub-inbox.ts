import * as assert from "assert";
import { generateKeyPairSync, sign } from "node:crypto";
import * as http from "node:http";
import { once } from "node:events";
import Koa from "koa";
import httpSignature from "@peertube/http-signature";
import { createSignedPost } from "../src/remote/activitypub/ap-request.js";
import { createInboxRouter } from "../src/server/activitypub/inbox.js";
import type { IActivity } from "../src/remote/activitypub/type.js";

describe("ActivityPub inbox digest validation", () => {
	const keypair = generateKeyPairSync("rsa", {
		modulusLength: 2048,
		publicKeyEncoding: { type: "spki", format: "pem" },
		privateKeyEncoding: { type: "pkcs8", format: "pem" },
	});
	const key = {
		keyId: "https://example.com/actor#key",
		privateKeyPem: keypair.privateKey,
	};
	const body =
		'{\n  "type": "Create", "actor": "https://example.com/actor",\n  "object": { "content": "こんにちは 🐈" }\n}\n';
	let server: http.Server;
	let baseUrl: string;
	let queued: {
		activity: IActivity;
		signature: httpSignature.IParsedSignature;
	}[];

	before(async () => {
		const app = new Koa();
		app.use(
			createInboxRouter((activity, signature) => {
				queued.push({ activity, signature });
			}).routes(),
		);
		server = app.listen(0, "127.0.0.1");
		await once(server, "listening");
		const address = server.address();
		if (address == null || typeof address === "string")
			throw new Error("No TCP address");
		baseUrl = `http://127.0.0.1:${address.port}`;
	});

	after(
		() =>
			new Promise<void>((resolve, reject) => {
				server.close((error) => (error ? reject(error) : resolve()));
			}),
	);

	beforeEach(() => {
		queued = [];
	});

	async function post(
		path: string,
		headers: Record<string, string>,
		content = body,
	) {
		return new Promise<number | undefined>((resolve, reject) => {
			const req = http.request(
				`${baseUrl}${path}`,
				{ method: "POST", headers },
				(res) => {
					res.resume();
					res.on("end", () => resolve(res.statusCode));
					res.on("error", reject);
				},
			);
			req.on("error", reject);
			req.end(content);
		});
	}

	function signedHeaders(
		path: string,
		content = body,
		additionalHeaders: Record<string, string> = {},
	) {
		return createSignedPost({
			key,
			url: `${baseUrl}${path}`,
			body: content,
			additionalHeaders,
		}).request.headers;
	}

	for (const path of ["/inbox", "/users/alice/inbox"]) {
		describe(path, () => {
			for (const contentType of [
				"application/json",
				"application/activity+json",
				'application/ld+json; profile="https://www.w3.org/ns/activitystreams"',
			]) {
				it(`accepts a signed matching digest for ${contentType}`, async () => {
					const status = await post(
						path,
						signedHeaders(path, body, { "content-type": contentType }),
					);
					assert.strictEqual(status, 202);
					assert.strictEqual(queued.length, 1);
					assert.deepStrictEqual(queued[0].activity, JSON.parse(body));
					assert.strictEqual(
						httpSignature.verifySignature(
							queued[0].signature,
							keypair.publicKey,
						),
						true,
					);
				});
			}

			it("rejects a missing digest without queueing", async () => {
				const headers = signedHeaders(path);
				delete headers.digest;
				assert.strictEqual(await post(path, headers), 401);
				assert.strictEqual(queued.length, 0);
			});

			it("rejects a digest that is present but not signed", async () => {
				const signed = createSignedPost({
					key,
					url: `${baseUrl}${path}`,
					body,
					additionalHeaders: {},
				});
				const signingString = signed.signingString
					.split("\n")
					.filter((line) => !line.startsWith("digest:"))
					.join("\n");
				const signature = sign(
					"sha256",
					Buffer.from(signingString),
					keypair.privateKey,
				).toString("base64");
				const headers = signed.request.headers;
				headers.signature = `keyId="${key.keyId}",algorithm="rsa-sha256",headers="(request-target) date host",signature="${signature}"`;
				assert.strictEqual(await post(path, headers), 401);
				assert.strictEqual(queued.length, 0);
			});

			it("rejects a modified body with the original signed digest", async () => {
				assert.strictEqual(
					await post(
						path,
						signedHeaders(path),
						body.replace("こんにちは", "modified"),
					),
					401,
				);
				assert.strictEqual(queued.length, 0);
			});

			it("rejects even whitespace-only changes to the signed body", async () => {
				assert.strictEqual(
					await post(
						path,
						signedHeaders(path),
						JSON.stringify(JSON.parse(body)),
					),
					401,
				);
				assert.strictEqual(queued.length, 0);
			});

			for (const digest of ["SHA-512=invalid", "SHA-256=invalid"]) {
				it(`rejects a signed invalid digest: ${digest}`, async () => {
					assert.strictEqual(
						await post(path, signedHeaders(path, body, { digest })),
						401,
					);
					assert.strictEqual(queued.length, 0);
				});
			}

			it("rejects a missing signature", async () => {
				const headers = signedHeaders(path);
				delete headers.signature;
				assert.strictEqual(await post(path, headers), 401);
				assert.strictEqual(queued.length, 0);
			});

			it("rejects a request without a raw JSON body", async () => {
				assert.strictEqual(
					await post(
						path,
						signedHeaders(path, body, { "content-type": "text/plain" }),
					),
					401,
				);
				assert.strictEqual(queued.length, 0);
			});

			it("does not merge query parameters into the signed activity", async () => {
				const queryPath = `${path}?type=Delete`;
				const signed = createSignedPost({
					key,
					url: `${baseUrl}${queryPath}`,
					body,
					additionalHeaders: {},
				});
				const signingString = signed.signingString.replace(
					`post ${path}\n`,
					`post ${queryPath}\n`,
				);
				const signature = sign(
					"sha256",
					Buffer.from(signingString),
					keypair.privateKey,
				).toString("base64");
				const headers = signed.request.headers;
				headers.signature = signed.signatureHeader.replace(
					/signature="[^"]+"/,
					`signature="${signature}"`,
				);
				assert.strictEqual(await post(queryPath, headers), 202);
				assert.deepStrictEqual(queued[0].activity, JSON.parse(body));
				assert.strictEqual(
					httpSignature.verifySignature(queued[0].signature, keypair.publicKey),
					true,
				);
			});
		});
	}
});
