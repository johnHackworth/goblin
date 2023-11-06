import megalodon, { MegalodonInterface } from "megalodon";
import Router from "@koa/router";
import { getClient } from "../ApiMastodonCompatibleService.js";
import { IdType, convertId } from "../../index.js";
import { convertFilter } from "../converters.js";

export function apiFilterMastodon(router: Router): void {
	router.get("/v1/filters", async (ctx) => {
		const BASE_URL = `${ctx.request.protocol}://${ctx.request.hostname}`;
		const accessTokens = ctx.request.headers.authorization;
		const client = getClient(BASE_URL, accessTokens);
		const body: any = ctx.request.body;
		try {
			const data = await client.getFilters();
			ctx.body = data.data.map((filter) => convertFilter(filter));
		} catch (e: any) {
			console.error(e);
			ctx.status = 401;
			ctx.body = e.response.data;
		}
	});

	router.get("/v1/filters/:id", async (ctx) => {
		const BASE_URL = `${ctx.request.protocol}://${ctx.request.hostname}`;
		const accessTokens = ctx.request.headers.authorization;
		const client = getClient(BASE_URL, accessTokens);
		const body: any = ctx.request.body;
		try {
			const data = await client.getFilter(
				convertId(ctx.params.id, IdType.FirefishId),
			);
			ctx.body = convertFilter(data.data);
		} catch (e: any) {
			console.error(e);
			ctx.status = 401;
			ctx.body = e.response.data;
		}
	});

	router.post("/v1/filters", async (ctx) => {
		const BASE_URL = `${ctx.request.protocol}://${ctx.request.hostname}`;
		const accessTokens = ctx.request.headers.authorization;
		const client = getClient(BASE_URL, accessTokens);
		const body: any = ctx.request.body;
		try {
			const data = await client.createFilter(body.phrase, body.context, body);
			ctx.body = convertFilter(data.data);
		} catch (e: any) {
			console.error(e);
			ctx.status = 401;
			ctx.body = e.response.data;
		}
	});

	router.post("/v1/filters/:id", async (ctx) => {
		const BASE_URL = `${ctx.request.protocol}://${ctx.request.hostname}`;
		const accessTokens = ctx.request.headers.authorization;
		const client = getClient(BASE_URL, accessTokens);
		const body: any = ctx.request.body;
		try {
			const data = await client.updateFilter(
				convertId(ctx.params.id, IdType.FirefishId),
				body.phrase,
				body.context,
			);
			ctx.body = convertFilter(data.data);
		} catch (e: any) {
			console.error(e);
			ctx.status = 401;
			ctx.body = e.response.data;
		}
	});

	router.delete("/v1/filters/:id", async (ctx) => {
		const BASE_URL = `${ctx.request.protocol}://${ctx.request.hostname}`;
		const accessTokens = ctx.request.headers.authorization;
		const client = getClient(BASE_URL, accessTokens);
		const body: any = ctx.request.body;
		try {
			const data = await client.deleteFilter(
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
