import Router from "@koa/router";
import { getClient } from "../ApiMastodonCompatibleService.js";
import { ParsedUrlQuery } from "querystring";
import { convertAccount, convertList, convertStatus } from "../converters.js";
import { convertId, IdType } from "../../index.js";

export function limitToInt(q: ParsedUrlQuery) {
	let object: any = q;
	if (q.limit)
		if (typeof q.limit === "string") object.limit = parseInt(q.limit, 10);
	if (q.offset)
		if (typeof q.offset === "string") object.offset = parseInt(q.offset, 10);
	return object;
}

export function argsToBools(q: ParsedUrlQuery) {
	// Values taken from https://docs.joinmastodon.org/client/intro/#boolean
	const toBoolean = (value: string) =>
		!["0", "f", "F", "false", "FALSE", "off", "OFF"].includes(value);

	let object: any = q;
	if (q.only_media)
		if (typeof q.only_media === "string")
			object.only_media = toBoolean(q.only_media);
	if (q.exclude_replies)
		if (typeof q.exclude_replies === "string")
			object.exclude_replies = toBoolean(q.exclude_replies);
	return q;
}

export function convertTimelinesArgsId(q: ParsedUrlQuery) {
	if (typeof q.min_id === "string")
		q.min_id = convertId(q.min_id, IdType.FirefishId);
	if (typeof q.max_id === "string")
		q.max_id = convertId(q.max_id, IdType.FirefishId);
	if (typeof q.since_id === "string")
		q.since_id = convertId(q.since_id, IdType.FirefishId);
	return q;
}

export function apiTimelineMastodon(router: Router): void {
	router.get("/v1/timelines/public", async (ctx, reply) => {
		const BASE_URL = `${ctx.protocol}://${ctx.hostname}`;
		const accessTokens = ctx.headers.authorization;
		const client = getClient(BASE_URL, accessTokens);
		try {
			const query: any = ctx.query;
			const data =
				query.local === "true"
					? await client.getLocalTimeline(
							convertTimelinesArgsId(argsToBools(limitToInt(query))),
					  )
					: await client.getPublicTimeline(
							convertTimelinesArgsId(argsToBools(limitToInt(query))),
					  );
			ctx.body = data.data.map((status) => convertStatus(status));
		} catch (e: any) {
			console.error(e);
			console.error(e.response.data);
			ctx.status = 401;
			ctx.body = e.response.data;
		}
	});
	router.get<{ Params: { hashtag: string } }>(
		"/v1/timelines/tag/:hashtag",
		async (ctx, reply) => {
			const BASE_URL = `${ctx.protocol}://${ctx.hostname}`;
			const accessTokens = ctx.headers.authorization;
			const client = getClient(BASE_URL, accessTokens);
			try {
				const data = await client.getTagTimeline(
					ctx.params.hashtag,
					convertTimelinesArgsId(argsToBools(limitToInt(ctx.query))),
				);
				ctx.body = data.data.map((status) => convertStatus(status));
			} catch (e: any) {
				console.error(e);
				console.error(e.response.data);
				ctx.status = 401;
				ctx.body = e.response.data;
			}
		},
	);
	router.get("/v1/timelines/home", async (ctx, reply) => {
		const BASE_URL = `${ctx.protocol}://${ctx.hostname}`;
		const accessTokens = ctx.headers.authorization;
		const client = getClient(BASE_URL, accessTokens);
		try {
			const data = await client.getHomeTimeline(
				convertTimelinesArgsId(limitToInt(ctx.query)),
			);
			ctx.body = data.data.map((status) => convertStatus(status));
		} catch (e: any) {
			console.error(e);
			console.error(e.response.data);
			ctx.status = 401;
			ctx.body = e.response.data;
		}
	});
	router.get<{ Params: { listId: string } }>(
		"/v1/timelines/list/:listId",
		async (ctx, reply) => {
			const BASE_URL = `${ctx.protocol}://${ctx.hostname}`;
			const accessTokens = ctx.headers.authorization;
			const client = getClient(BASE_URL, accessTokens);
			try {
				const data = await client.getListTimeline(
					convertId(ctx.params.listId, IdType.FirefishId),
					convertTimelinesArgsId(limitToInt(ctx.query)),
				);
				ctx.body = data.data.map((status) => convertStatus(status));
			} catch (e: any) {
				console.error(e);
				console.error(e.response.data);
				ctx.status = 401;
				ctx.body = e.response.data;
			}
		},
	);
	router.get("/v1/conversations", async (ctx, reply) => {
		const BASE_URL = `${ctx.protocol}://${ctx.hostname}`;
		const accessTokens = ctx.headers.authorization;
		const client = getClient(BASE_URL, accessTokens);
		try {
			const data = await client.getConversationTimeline(
				convertTimelinesArgsId(limitToInt(ctx.query)),
			);
			ctx.body = data.data;
		} catch (e: any) {
			console.error(e);
			console.error(e.response.data);
			ctx.status = 401;
			ctx.body = e.response.data;
		}
	});
	router.get("/v1/lists", async (ctx, reply) => {
		const BASE_URL = `${ctx.protocol}://${ctx.hostname}`;
		const accessTokens = ctx.headers.authorization;
		const client = getClient(BASE_URL, accessTokens);
		try {
			const data = await client.getLists();
			ctx.body = data.data.map((list) => convertList(list));
		} catch (e: any) {
			console.error(e);
			console.error(e.response.data);
			ctx.status = 401;
			ctx.body = e.response.data;
		}
	});
	router.get<{ Params: { id: string } }>(
		"/v1/lists/:id",
		async (ctx, reply) => {
			const BASE_URL = `${ctx.protocol}://${ctx.hostname}`;
			const accessTokens = ctx.headers.authorization;
			const client = getClient(BASE_URL, accessTokens);
			try {
				const data = await client.getList(
					convertId(ctx.params.id, IdType.FirefishId),
				);
				ctx.body = convertList(data.data);
			} catch (e: any) {
				console.error(e);
				console.error(e.response.data);
				ctx.status = 401;
				ctx.body = e.response.data;
			}
		},
	);
	router.post("/v1/lists", async (ctx, reply) => {
		const BASE_URL = `${ctx.protocol}://${ctx.hostname}`;
		const accessTokens = ctx.headers.authorization;
		const client = getClient(BASE_URL, accessTokens);
		try {
			const data = await client.createList((ctx.request.body as any).title);
			ctx.body = convertList(data.data);
		} catch (e: any) {
			console.error(e);
			console.error(e.response.data);
			ctx.status = 401;
			ctx.body = e.response.data;
		}
	});
	router.put<{ Params: { id: string } }>(
		"/v1/lists/:id",
		async (ctx, reply) => {
			const BASE_URL = `${ctx.protocol}://${ctx.hostname}`;
			const accessTokens = ctx.headers.authorization;
			const client = getClient(BASE_URL, accessTokens);
			try {
				const data = await client.updateList(
					convertId(ctx.params.id, IdType.FirefishId),
					(ctx.request.body as any).title,
				);
				ctx.body = convertList(data.data);
			} catch (e: any) {
				console.error(e);
				console.error(e.response.data);
				ctx.status = 401;
				ctx.body = e.response.data;
			}
		},
	);
	router.delete<{ Params: { id: string } }>(
		"/v1/lists/:id",
		async (ctx, reply) => {
			const BASE_URL = `${ctx.protocol}://${ctx.hostname}`;
			const accessTokens = ctx.headers.authorization;
			const client = getClient(BASE_URL, accessTokens);
			try {
				const data = await client.deleteList(
					convertId(ctx.params.id, IdType.FirefishId),
				);
				ctx.body = data.data;
			} catch (e: any) {
				console.error(e);
				console.error(e.response.data);
				ctx.status = 401;
				ctx.body = e.response.data;
			}
		},
	);
	router.get<{ Params: { id: string } }>(
		"/v1/lists/:id/accounts",
		async (ctx, reply) => {
			const BASE_URL = `${ctx.protocol}://${ctx.hostname}`;
			const accessTokens = ctx.headers.authorization;
			const client = getClient(BASE_URL, accessTokens);
			try {
				const data = await client.getAccountsInList(
					convertId(ctx.params.id, IdType.FirefishId),
					convertTimelinesArgsId(ctx.query as any),
				);
				ctx.body = data.data.map((account) => convertAccount(account));
			} catch (e: any) {
				console.error(e);
				console.error(e.response.data);
				ctx.status = 401;
				ctx.body = e.response.data;
			}
		},
	);
	router.post<{ Params: { id: string } }>(
		"/v1/lists/:id/accounts",
		async (ctx, reply) => {
			const BASE_URL = `${ctx.protocol}://${ctx.hostname}`;
			const accessTokens = ctx.headers.authorization;
			const client = getClient(BASE_URL, accessTokens);
			try {
				const data = await client.addAccountsToList(
					convertId(ctx.params.id, IdType.FirefishId),
					(ctx.query.account_ids as string[]).map((id) =>
						convertId(id, IdType.FirefishId),
					),
				);
				ctx.body = data.data;
			} catch (e: any) {
				console.error(e);
				console.error(e.response.data);
				ctx.status = 401;
				ctx.body = e.response.data;
			}
		},
	);
	router.delete<{ Params: { id: string } }>(
		"/v1/lists/:id/accounts",
		async (ctx, reply) => {
			const BASE_URL = `${ctx.protocol}://${ctx.hostname}`;
			const accessTokens = ctx.headers.authorization;
			const client = getClient(BASE_URL, accessTokens);
			try {
				const data = await client.deleteAccountsFromList(
					convertId(ctx.params.id, IdType.FirefishId),
					(ctx.query.account_ids as string[]).map((id) =>
						convertId(id, IdType.FirefishId),
					),
				);
				ctx.body = data.data;
			} catch (e: any) {
				console.error(e);
				console.error(e.response.data);
				ctx.status = 401;
				ctx.body = e.response.data;
			}
		},
	);
}
function escapeHTML(str: string) {
	if (!str) {
		return "";
	}
	return str
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#039;");
}
function nl2br(str: string) {
	if (!str) {
		return "";
	}
	str = str.replace(/\r\n/g, "<br />");
	str = str.replace(/(\n|\r)/g, "<br />");
	return str;
}
