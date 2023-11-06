import megalodon, { MegalodonInterface } from "megalodon";
import Router from "@koa/router";
import { koaBody } from "koa-body";
import { convertId, IdType } from "../../index.js";
import { getClient } from "../ApiMastodonCompatibleService.js";
import { convertTimelinesArgsId } from "./timeline.js";
import { convertNotification } from "../converters.js";
function toLimitToInt(q: any) {
	if (q.limit) if (typeof q.limit === "string") q.limit = parseInt(q.limit, 10);
	return q;
}

export function apiNotificationsMastodon(router: Router): void {
	router.get("/v1/notifications", async (ctx) => {
		const BASE_URL = `${ctx.request.protocol}://${ctx.request.hostname}`;
		const accessTokens = ctx.request.headers.authorization;
		const client = getClient(BASE_URL, accessTokens);
		const body: any = ctx.request.body;
		try {
			const data = await client.getNotifications(
				convertTimelinesArgsId(toLimitToInt(ctx.query)),
			);
			const notfs = data.data;
			const ret = notfs.map((n) => {
				n = convertNotification(n);
				if (n.type !== "follow" && n.type !== "follow_request") {
					if (n.type === "reaction") n.type = "favourite";
					return n;
				} else {
					return n;
				}
			});
			ctx.body = ret;
		} catch (e: any) {
			console.error(e);
			ctx.status = 401;
			ctx.body = e.response.data;
		}
	});

	router.get("/v1/notification/:id", async (ctx) => {
		const BASE_URL = `${ctx.request.protocol}://${ctx.request.hostname}`;
		const accessTokens = ctx.request.headers.authorization;
		const client = getClient(BASE_URL, accessTokens);
		const body: any = ctx.request.body;
		try {
			const dataRaw = await client.getNotification(
				convertId(ctx.params.id, IdType.FirefishId),
			);
			const data = convertNotification(dataRaw.data);
			ctx.body = data;
			if (
				data.type !== "follow" &&
				data.type !== "follow_request" &&
				data.type === "reaction"
			) {
				data.type = "favourite";
			}
		} catch (e: any) {
			console.error(e);
			ctx.status = 401;
			ctx.body = e.response.data;
		}
	});

	router.post("/v1/notifications/clear", async (ctx) => {
		const BASE_URL = `${ctx.request.protocol}://${ctx.request.hostname}`;
		const accessTokens = ctx.request.headers.authorization;
		const client = getClient(BASE_URL, accessTokens);
		const body: any = ctx.request.body;
		try {
			const data = await client.dismissNotifications();
			ctx.body = data.data;
		} catch (e: any) {
			console.error(e);
			ctx.status = 401;
			ctx.body = e.response.data;
		}
	});

	router.post("/v1/notification/:id/dismiss", async (ctx) => {
		const BASE_URL = `${ctx.request.protocol}://${ctx.request.hostname}`;
		const accessTokens = ctx.request.headers.authorization;
		const client = getClient(BASE_URL, accessTokens);
		const body: any = ctx.request.body;
		try {
			const data = await client.dismissNotification(
				convertId(ctx.params.id, IdType.FirefishId),
			);
			ctx.body = data.data;
		} catch (e: any) {
			console.error(e);
			ctx.status = 401;
			ctx.body = e.response.data;
		}
	});
}
