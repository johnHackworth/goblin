import { URL } from "url";
import httpSignature from "@peertube/http-signature";
import config from "@/config/index.js";
import { fetchMeta } from "@/misc/fetch-meta.js";
import { toPuny } from "@/misc/convert-host.js";
import DbResolver from "@/remote/activitypub/db-resolver.js";
import { getApId } from "@/remote/activitypub/type.js";
import { shouldBlockInstance } from "@/misc/should-block-instance.js";
import type { IncomingMessage } from "http";
import type { CacheableRemoteUser } from "@/models/entities/user.js";
import type { UserPublickey } from "@/models/entities/user-publickey.js";

export async function hasSignature(req: IncomingMessage): Promise<string> {
	const meta = await fetchMeta();
	const required = meta.secureMode || meta.privateMode;

	try {
		httpSignature.parseRequest(req, { headers: [] });
	} catch (e) {
		if (e instanceof Error && e.name === "MissingHeaderError") {
			return required ? "missing" : "optional";
		}
		return "invalid";
	}
	return required ? "supplied" : "unneeded";
}

export async function checkFetch(req: IncomingMessage): Promise<number> {
	const meta = await fetchMeta();
	if (meta.secureMode || meta.privateMode) {
		let signature;

		try {
			signature = httpSignature.parseRequest(req, { headers: [] });
		} catch (e) {
			return 401;
		}

		const keyId = new URL(signature.keyId);
		const host = toPuny(keyId.hostname);

		if (await shouldBlockInstance(host, meta)) {
			return 403;
		}

		if (
			meta.privateMode &&
			host !== config.host &&
			!meta.allowedHosts.includes(host)
		) {
			return 403;
		}

		const keyIdLower = signature.keyId.toLowerCase();
		if (keyIdLower.startsWith("acct:")) {
			// Old keyId is no longer supported.
			return 401;
		}

		const dbResolver = new DbResolver();

		// HTTP-Signature keyIdを元にDBから取得
		let authUser = await dbResolver.getAuthUserFromKeyId(signature.keyId);

		// keyIdでわからなければ、resolveしてみる
		if (authUser == null) {
			try {
				keyId.hash = "";
				authUser = await dbResolver.getAuthUserFromApId(
					getApId(keyId.toString()),
				);
			} catch (e) {
				// できなければ駄目
				return 403;
			}
		}

		// publicKey がなくても終了
		if (authUser?.key == null) {
			return 403;
		}

		// もう一回チェック
		if (authUser.user.host !== host) {
			return 403;
		}

		// HTTP-Signatureの検証
		const httpSignatureValidated = httpSignature.verifySignature(
			signature,
			authUser.key.keyPem,
		);

		if (!httpSignatureValidated) {
			return 403;
		}
	}
	return 200;
}

export async function getSignatureUser(req: IncomingMessage): Promise<{
	user: CacheableRemoteUser;
	key: UserPublickey | null;
} | null> {
	const signature = httpSignature.parseRequest(req, { headers: [] });
	const keyId = new URL(signature.keyId);
	const dbResolver = new DbResolver();

	// Retrieve from DB by HTTP-Signature keyId
	const authUser = await dbResolver.getAuthUserFromKeyId(signature.keyId);
	if (authUser) {
		return authUser;
	}

	// Resolve if failed to retrieve by keyId
	keyId.hash = "";
	return await dbResolver.getAuthUserFromApId(getApId(keyId.toString()));
}
