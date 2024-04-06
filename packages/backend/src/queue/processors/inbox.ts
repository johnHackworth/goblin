import { URL } from "node:url";
import type Bull from "bull";
import httpSignature from "@peertube/http-signature";
import perform from "@/remote/activitypub/perform.js";
import Logger from "@/services/logger.js";
import { registerOrFetchInstanceDoc } from "@/services/register-or-fetch-instance-doc.js";
import { Instances } from "@/models/index.js";
import {
	apRequestChart,
	federationChart,
	instanceChart,
} from "@/services/chart/index.js";
import { fetchMeta } from "@/misc/fetch-meta.js";
import { toPuny, extractDbHost } from "@/misc/convert-host.js";
import { getApId } from "@/remote/activitypub/type.js";
import { fetchInstanceMetadata } from "@/services/fetch-instance-metadata.js";
import type { InboxJobData } from "../types.js";
import DbResolver from "@/remote/activitypub/db-resolver.js";
import { resolvePerson } from "@/remote/activitypub/models/person.js";
import { LdSignature } from "@/remote/activitypub/misc/ld-signature.js";
import { StatusError } from "@/misc/fetch.js";
import type { CacheableRemoteUser } from "@/models/entities/user.js";
import type { UserPublickey } from "@/models/entities/user-publickey.js";
import { shouldBlockInstance } from "@/misc/should-block-instance.js";
import { verifySignature } from "@/remote/activitypub/check-fetch.js";

const logger = new Logger("inbox");

// Processing when an activity arrives in the user's inbox
export default async (job: Bull.Job<InboxJobData>): Promise<string> => {
	const signature = job.data.signature; // HTTP-signature
	const activity = job.data.activity;

	//#region Log
	const info = Object.assign({}, activity) as any;
	info["@context"] = undefined;
	logger.debug(JSON.stringify(info, null, 2));

	if (!signature?.keyId) {
		const err = `Invalid signature: ${signature}`;
		job.moveToFailed({ message: err });
		return err;
	}
	//#endregion
	const host = toPuny(new URL(signature.keyId).hostname);

	// interrupt if blocked
	const meta = await fetchMeta();
	if (await shouldBlockInstance(host, meta)) {
		return `Blocked request: ${host}`;
	}

	// only whitelisted instances in private mode
	if (meta.privateMode && !meta.allowedHosts.includes(host)) {
		return `Blocked request: ${host}`;
	}

	const keyIdLower = signature.keyId.toLowerCase();
	if (keyIdLower.startsWith("acct:")) {
		return `Old keyId is no longer supported. ${keyIdLower}`;
	}

	const dbResolver = new DbResolver();

	// HTTP-Signature keyId from DB
	let authUser: {
		user: CacheableRemoteUser;
		key: UserPublickey | null;
	} | null = await dbResolver.getAuthUserFromKeyId(signature.keyId);

	// keyIdでわからなければ、activity.actorを元にDBから取得 || activity.actorを元にリモートから取得
	if (authUser == null) {
		try {
			authUser = await dbResolver.getAuthUserFromApId(getApId(activity.actor));
		} catch (e) {
			// Skip if target is 4xx
			if (e instanceof StatusError) {
				if (e.isClientError) {
					return `skip: Ignored deleted actors on both ends ${activity.actor} - ${e.statusCode}`;
				}
				throw new Error(
					`Error in actor ${activity.actor} - ${e.statusCode || e}`,
				);
			}
		}
	}

	// それでもわからなければ終了
	if (authUser == null) {
		return "skip: failed to resolve user";
	}

	// publicKey がなくても終了
	if (authUser.key == null) {
		return "skip: failed to resolve user publicKey";
	}

	// HTTP-Signatureの検証
	let httpSignatureValidated = httpSignature.verifySignature(
		signature,
		authUser.key.keyPem,
	);

	// If signature validation failed, try refetching the actor
	if (!httpSignatureValidated) {
		authUser.key = await dbResolver.refetchPublicKeyForApId(authUser.user);

		if (authUser.key == null) {
			return "skip: failed to re-resolve user publicKey";
		}

		httpSignatureValidated = httpSignature.verifySignature(
			signature,
			authUser.key.keyPem,
		);
	}

	if (httpSignatureValidated) {
		if (!verifySignature(signature, authUser.key))
			return `skip: Invalid HTTP signature`;
	}

	// また、signatureのsignerは、activity.actorと一致する必要がある
	if (!httpSignatureValidated || authUser.user.uri !== activity.actor) {
		// 一致しなくても、でもLD-Signatureがありそうならそっちも見る
		if (activity.signature) {
			if (activity.signature.type !== "RsaSignature2017") {
				return `skip: unsupported LD-signature type ${activity.signature.type}`;
			}

			// activity.signature.creator: https://example.oom/users/user#main-key
			// みたいになっててUserを引っ張れば公開キーも入ることを期待する
			if (activity.signature.creator) {
				const candicate = activity.signature.creator.replace(/#.*/, "");
				await resolvePerson(candicate).catch(() => null);
			}

			// keyIdからLD-Signatureのユーザーを取得
			authUser = await dbResolver.getAuthUserFromKeyId(
				activity.signature.creator,
			);
			if (authUser == null) {
				return "skip: LD-Signatureのユーザーが取得できませんでした";
			}

			if (authUser.key == null) {
				return "skip: LD-SignatureのユーザーはpublicKeyを持っていませんでした";
			}

			// LD-Signature検証
			const ldSignature = new LdSignature();
			const verified = await ldSignature
				.verifyRsaSignature2017(activity, authUser.key.keyPem)
				.catch(() => false);
			if (!verified) {
				return "skip: LD-Signatureの検証に失敗しました";
			}

			// もう一度actorチェック
			if (authUser.user.uri !== activity.actor) {
				return `skip: LD-Signature user(${authUser.user.uri}) !== activity.actor(${activity.actor})`;
			}

			// ブロックしてたら中断
			const ldHost = extractDbHost(authUser.user.uri);
			if (await shouldBlockInstance(ldHost, meta)) {
				return `Blocked request: ${ldHost}`;
			}
		} else {
			return `skip: http-signature verification failed and no LD-Signature. keyId=${signature.keyId}`;
		}
	}

	// activity.idがあればホストが署名者のホストであることを確認する
	if (typeof activity.id === "string") {
		const signerHost = extractDbHost(authUser.user.uri!);
		const activityIdHost = extractDbHost(activity.id);
		if (signerHost !== activityIdHost) {
			return `skip: signerHost(${signerHost}) !== activity.id host(${activityIdHost}`;
		}
	}

	// Update stats
	registerOrFetchInstanceDoc(authUser.user.host).then((i) => {
		Instances.update(i.id, {
			latestRequestReceivedAt: new Date(),
			lastCommunicatedAt: new Date(),
			isNotResponding: false,
		});

		fetchInstanceMetadata(i);

		instanceChart.requestReceived(i.host);
		apRequestChart.inbox();
		federationChart.inbox(i.host);
	});

	// アクティビティを処理
	await perform(authUser.user, activity);
	return "ok";
};
