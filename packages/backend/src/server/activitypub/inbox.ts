import Router from "@koa/router";
import bodyParser from "koa-bodyparser";
import httpSignature from "@peertube/http-signature";
import type { IActivity } from "@/remote/activitypub/type.js";
import { verifyDigest } from "@/remote/activitypub/misc/verify-digest.js";

export function createInboxRouter(
	enqueue: (
		activity: IActivity,
		signature: httpSignature.IParsedSignature,
	) => void,
) {
	const router = new Router();
	const parseBody = bodyParser({
		enableTypes: ["json"],
		extendTypes: {
			json: ["application/activity+json", "application/ld+json"],
		},
	});

	function inbox(ctx: Router.RouterContext) {
		let signature;
		try {
			// A digest header alone is insufficient: the signature must cover it.
			signature = httpSignature.parseRequest(ctx.req, { headers: ["digest"] });
		} catch {
			ctx.status = 401;
			return;
		}

		// Hash the original JSON, preserving whitespace and Unicode encoding.
		if (!verifyDigest(ctx.request.rawBody, ctx.req.headers.digest)) {
			ctx.status = 401;
			return;
		}

		// Cryptographic signature verification remains in the inbox worker.
		enqueue(ctx.request.body, signature);
		ctx.status = 202;
	}

	router.post("/inbox", parseBody, inbox);
	router.post("/users/:user/inbox", parseBody, inbox);
	return router;
}
