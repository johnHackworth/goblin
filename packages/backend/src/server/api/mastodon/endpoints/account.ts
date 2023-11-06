import { Users } from "@/models/index.js";
import { resolveUser } from "@/remote/resolve-user.js";
import Router from "@koa/router";
import { FindOptionsWhere, IsNull } from "typeorm";
import { getClient } from "../ApiMastodonCompatibleService.js";
import { argsToBools, convertTimelinesArgsId, limitToInt } from "./timeline.js";
import { convertId, IdType } from "../../index.js";
import {
	convertAccount,
	convertFeaturedTag,
	convertList,
	convertRelationship,
	convertStatus,
} from "../converters.js";

const relationshipModel = {
	id: "",
	following: false,
	followed_by: false,
	delivery_following: false,
	blocking: false,
	blocked_by: false,
	muting: false,
	muting_notifications: false,
	requested: false,
	domain_blocking: false,
	showing_reblogs: false,
	endorsed: false,
	notifying: false,
	note: "",
};

export function apiAccountMastodon(router: Router): void {
	router.get("/v1/accounts/verify_credentials", async (ctx) => {
		const BASE_URL = `${ctx.protocol}://${ctx.hostname}`;
		const accessTokens = ctx.headers.authorization;
		const client = getClient(BASE_URL, accessTokens);
		try {
			const data = await client.verifyAccountCredentials();
			let acct = data.data;
			acct.id = convertId(acct.id, IdType.MastodonId);
			acct.display_name = acct.display_name || acct.username;
			acct.url = `${BASE_URL}/@${acct.url}`;
			acct.note = acct.note || "";
			acct.avatar_static = acct.avatar;
			acct.header = acct.header || "/static-assets/transparent.png";
			acct.header_static = acct.header || "/static-assets/transparent.png";
			acct.source = {
				note: acct.note,
				fields: acct.fields,
				privacy: await client.getDefaultPostPrivacy(),
				sensitive: false,
				language: "",
			};
			console.log(acct);
			ctx.body = acct;
		} catch (e: any) {
			console.error(e);
			console.error(e.response.data);
			ctx.status = 401;
			ctx.body = e.response.data;
		}
	});
	router.patch("/v1/accounts/update_credentials", async (ctx) => {
		const BASE_URL = `${ctx.protocol}://${ctx.hostname}`;
		const accessTokens = ctx.headers.authorization;
		const client = getClient(BASE_URL, accessTokens);
		try {
			const data = await client.updateCredentials(
				(ctx.request as any).body as any,
			);
			ctx.body = convertAccount(data.data);
		} catch (e: any) {
			console.error(e);
			console.error(e.response.data);
			ctx.status = 401;
			ctx.body = e.response.data;
		}
	});
	router.get("/v1/accounts/lookup", async (ctx) => {
		const BASE_URL = `${ctx.protocol}://${ctx.hostname}`;
		const accessTokens = ctx.headers.authorization;
		const client = getClient(BASE_URL, accessTokens);
		try {
			const data = await client.search(
				(ctx.request.query as any).acct,
				"accounts",
			);
			ctx.body = convertAccount(data.data.accounts[0]);
		} catch (e: any) {
			console.error(e);
			console.error(e.response.data);
			ctx.status = 401;
			ctx.body = e.response.data;
		}
	});
	router.get("/v1/accounts/relationships", async (ctx) => {
		const BASE_URL = `${ctx.protocol}://${ctx.hostname}`;
		const accessTokens = ctx.headers.authorization;
		const client = getClient(BASE_URL, accessTokens);
		let users;
		try {
			// TODO: this should be body
			let ids = ctx.request.query ? ctx.request.query["id[]"] : null;
			if (typeof ids === "string") {
				ids = [ids];
			}
			users = ids;
			relationshipModel.id = ids?.toString() || "1";
			if (!ids) {
				ctx.body = [relationshipModel];
				return;
			}

			let reqIds = [];
			for (let i = 0; i < ids.length; i++) {
				reqIds.push(convertId(ids[i], IdType.FirefishId));
			}

			const data = await client.getRelationships(reqIds);
			ctx.body = data.data.map((relationship) =>
				convertRelationship(relationship),
			);
		} catch (e: any) {
			console.error(e);
			let data = e.response.data;
			data.users = users;
			console.error(data);
			ctx.status = 401;
			ctx.body = data;
		}
	});
	router.get<{ Params: { id: string } }>("/v1/accounts/:id", async (ctx) => {
		const BASE_URL = `${ctx.protocol}://${ctx.hostname}`;
		const accessTokens = ctx.headers.authorization;
		const client = getClient(BASE_URL, accessTokens);
		try {
			const calcId = convertId(ctx.params.id, IdType.FirefishId);
			const data = await client.getAccount(calcId);
			ctx.body = convertAccount(data.data);
		} catch (e: any) {
			console.error(e);
			console.error(e.response.data);
			ctx.status = 401;
			ctx.body = e.response.data;
		}
	});
	router.get<{ Params: { id: string } }>(
		"/v1/accounts/:id/statuses",
		async (ctx) => {
			const BASE_URL = `${ctx.protocol}://${ctx.hostname}`;
			const accessTokens = ctx.headers.authorization;
			const client = getClient(BASE_URL, accessTokens);
			try {
				const data = await client.getAccountStatuses(
					convertId(ctx.params.id, IdType.FirefishId),
					convertTimelinesArgsId(argsToBools(limitToInt(ctx.query as any))),
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
	router.get<{ Params: { id: string } }>(
		"/v1/accounts/:id/featured_tags",
		async (ctx) => {
			const BASE_URL = `${ctx.protocol}://${ctx.hostname}`;
			const accessTokens = ctx.headers.authorization;
			const client = getClient(BASE_URL, accessTokens);
			try {
				const data = await client.getAccountFeaturedTags(
					convertId(ctx.params.id, IdType.FirefishId),
				);
				ctx.body = data.data.map((tag) => convertFeaturedTag(tag));
			} catch (e: any) {
				console.error(e);
				console.error(e.response.data);
				ctx.status = 401;
				ctx.body = e.response.data;
			}
		},
	);
	router.get<{ Params: { id: string } }>(
		"/v1/accounts/:id/followers",
		async (ctx) => {
			const BASE_URL = `${ctx.protocol}://${ctx.hostname}`;
			const accessTokens = ctx.headers.authorization;
			const client = getClient(BASE_URL, accessTokens);
			try {
				const data = await client.getAccountFollowers(
					convertId(ctx.params.id, IdType.FirefishId),
					convertTimelinesArgsId(limitToInt(ctx.query as any)),
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
	router.get<{ Params: { id: string } }>(
		"/v1/accounts/:id/following",
		async (ctx) => {
			const BASE_URL = `${ctx.protocol}://${ctx.hostname}`;
			const accessTokens = ctx.headers.authorization;
			const client = getClient(BASE_URL, accessTokens);
			try {
				const data = await client.getAccountFollowing(
					convertId(ctx.params.id, IdType.FirefishId),
					convertTimelinesArgsId(limitToInt(ctx.query as any)),
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
	router.get<{ Params: { id: string } }>(
		"/v1/accounts/:id/lists",
		async (ctx) => {
			const BASE_URL = `${ctx.protocol}://${ctx.hostname}`;
			const accessTokens = ctx.headers.authorization;
			const client = getClient(BASE_URL, accessTokens);
			try {
				const data = await client.getAccountLists(
					convertId(ctx.params.id, IdType.FirefishId),
				);
				ctx.body = data.data.map((list) => convertList(list));
			} catch (e: any) {
				console.error(e);
				console.error(e.response.data);
				ctx.status = 401;
				ctx.body = e.response.data;
			}
		},
	);
	router.post<{ Params: { id: string } }>(
		"/v1/accounts/:id/follow",
		async (ctx) => {
			const BASE_URL = `${ctx.protocol}://${ctx.hostname}`;
			const accessTokens = ctx.headers.authorization;
			const client = getClient(BASE_URL, accessTokens);
			try {
				const data = await client.followAccount(
					convertId(ctx.params.id, IdType.FirefishId),
				);
				let acct = convertRelationship(data.data);
				acct.following = true;
				ctx.body = acct;
			} catch (e: any) {
				console.error(e);
				console.error(e.response.data);
				ctx.status = 401;
				ctx.body = e.response.data;
			}
		},
	);
	router.post<{ Params: { id: string } }>(
		"/v1/accounts/:id/unfollow",
		async (ctx) => {
			const BASE_URL = `${ctx.protocol}://${ctx.hostname}`;
			const accessTokens = ctx.headers.authorization;
			const client = getClient(BASE_URL, accessTokens);
			try {
				const data = await client.unfollowAccount(
					convertId(ctx.params.id, IdType.FirefishId),
				);
				let acct = convertRelationship(data.data);
				acct.following = false;
				ctx.body = acct;
			} catch (e: any) {
				console.error(e);
				console.error(e.response.data);
				ctx.status = 401;
				ctx.body = e.response.data;
			}
		},
	);
	router.post<{ Params: { id: string } }>(
		"/v1/accounts/:id/block",
		async (ctx) => {
			const BASE_URL = `${ctx.protocol}://${ctx.hostname}`;
			const accessTokens = ctx.headers.authorization;
			const client = getClient(BASE_URL, accessTokens);
			try {
				const data = await client.blockAccount(
					convertId(ctx.params.id, IdType.FirefishId),
				);
				ctx.body = convertRelationship(data.data);
			} catch (e: any) {
				console.error(e);
				console.error(e.response.data);
				ctx.status = 401;
				ctx.body = e.response.data;
			}
		},
	);
	router.post<{ Params: { id: string } }>(
		"/v1/accounts/:id/unblock",
		async (ctx) => {
			const BASE_URL = `${ctx.protocol}://${ctx.hostname}`;
			const accessTokens = ctx.headers.authorization;
			const client = getClient(BASE_URL, accessTokens);
			try {
				const data = await client.unblockAccount(
					convertId(ctx.params.id, IdType.MastodonId),
				);
				ctx.body = convertRelationship(data.data);
			} catch (e: any) {
				console.error(e);
				console.error(e.response.data);
				ctx.status = 401;
				ctx.body = e.response.data;
			}
		},
	);
	router.post<{ Params: { id: string } }>(
		"/v1/accounts/:id/mute",
		async (ctx) => {
			const BASE_URL = `${ctx.protocol}://${ctx.hostname}`;
			const accessTokens = ctx.headers.authorization;
			const client = getClient(BASE_URL, accessTokens);
			try {
				const data = await client.muteAccount(
					convertId(ctx.params.id, IdType.FirefishId),
					(ctx.request as any).body as any,
				);
				ctx.body = convertRelationship(data.data);
			} catch (e: any) {
				console.error(e);
				console.error(e.response.data);
				ctx.status = 401;
				ctx.body = e.response.data;
			}
		},
	);
	router.post<{ Params: { id: string } }>(
		"/v1/accounts/:id/unmute",
		async (ctx) => {
			const BASE_URL = `${ctx.protocol}://${ctx.hostname}`;
			const accessTokens = ctx.headers.authorization;
			const client = getClient(BASE_URL, accessTokens);
			try {
				const data = await client.unmuteAccount(
					convertId(ctx.params.id, IdType.FirefishId),
				);
				ctx.body = convertRelationship(data.data);
			} catch (e: any) {
				console.error(e);
				console.error(e.response.data);
				ctx.status = 401;
				ctx.body = e.response.data;
			}
		},
	);
	router.get("/v1/featured_tags", async (ctx) => {
		const BASE_URL = `${ctx.protocol}://${ctx.hostname}`;
		const accessTokens = ctx.headers.authorization;
		const client = getClient(BASE_URL, accessTokens);
		try {
			const data = await client.getFeaturedTags();
			ctx.body = data.data.map((tag) => convertFeaturedTag(tag));
		} catch (e: any) {
			console.error(e);
			console.error(e.response.data);
			ctx.status = 401;
			ctx.body = e.response.data;
		}
	});
	router.get("/v1/followed_tags", async (ctx) => {
		const BASE_URL = `${ctx.protocol}://${ctx.hostname}`;
		const accessTokens = ctx.headers.authorization;
		const client = getClient(BASE_URL, accessTokens);
		try {
			const data = await client.getFollowedTags();
			ctx.body = data.data;
		} catch (e: any) {
			console.error(e);
			console.error(e.response.data);
			ctx.status = 401;
			ctx.body = e.response.data;
		}
	});
	router.get("/v1/bookmarks", async (ctx) => {
		const BASE_URL = `${ctx.protocol}://${ctx.hostname}`;
		const accessTokens = ctx.headers.authorization;
		const client = getClient(BASE_URL, accessTokens);
		try {
			const data = await client.getBookmarks(
				convertTimelinesArgsId(limitToInt(ctx.query as any)),
			);
			ctx.body = data.data.map((status) => convertStatus(status));
		} catch (e: any) {
			console.error(e);
			console.error(e.response.data);
			ctx.status = 401;
			ctx.body = e.response.data;
		}
	});
	router.get("/v1/favourites", async (ctx) => {
		const BASE_URL = `${ctx.protocol}://${ctx.hostname}`;
		const accessTokens = ctx.headers.authorization;
		const client = getClient(BASE_URL, accessTokens);
		try {
			const data = await client.getFavourites(
				convertTimelinesArgsId(limitToInt(ctx.query as any)),
			);
			ctx.body = data.data.map((status) => convertStatus(status));
		} catch (e: any) {
			console.error(e);
			console.error(e.response.data);
			ctx.status = 401;
			ctx.body = e.response.data;
		}
	});
	router.get("/v1/mutes", async (ctx) => {
		const BASE_URL = `${ctx.protocol}://${ctx.hostname}`;
		const accessTokens = ctx.headers.authorization;
		const client = getClient(BASE_URL, accessTokens);
		try {
			const data = await client.getMutes(
				convertTimelinesArgsId(limitToInt(ctx.query as any)),
			);
			ctx.body = data.data.map((account) => convertAccount(account));
		} catch (e: any) {
			console.error(e);
			console.error(e.response.data);
			ctx.status = 401;
			ctx.body = e.response.data;
		}
	});
	router.get("/v1/blocks", async (ctx) => {
		const BASE_URL = `${ctx.protocol}://${ctx.hostname}`;
		const accessTokens = ctx.headers.authorization;
		const client = getClient(BASE_URL, accessTokens);
		try {
			const data = await client.getBlocks(
				convertTimelinesArgsId(limitToInt(ctx.query as any)),
			);
			ctx.body = data.data.map((account) => convertAccount(account));
		} catch (e: any) {
			console.error(e);
			console.error(e.response.data);
			ctx.status = 401;
			ctx.body = e.response.data;
		}
	});
	router.get("/v1/follow_requests", async (ctx) => {
		const BASE_URL = `${ctx.protocol}://${ctx.hostname}`;
		const accessTokens = ctx.headers.authorization;
		const client = getClient(BASE_URL, accessTokens);
		try {
			const data = await client.getFollowRequests(
				((ctx.query as any) || { limit: 20 }).limit,
			);
			ctx.body = data.data.map((account) => convertAccount(account));
		} catch (e: any) {
			console.error(e);
			console.error(e.response.data);
			ctx.status = 401;
			ctx.body = e.response.data;
		}
	});
	router.post<{ Params: { id: string } }>(
		"/v1/follow_requests/:id/authorize",
		async (ctx) => {
			const BASE_URL = `${ctx.protocol}://${ctx.hostname}`;
			const accessTokens = ctx.headers.authorization;
			const client = getClient(BASE_URL, accessTokens);
			try {
				const data = await client.acceptFollowRequest(
					convertId(ctx.params.id, IdType.FirefishId),
				);
				ctx.body = convertRelationship(data.data);
			} catch (e: any) {
				console.error(e);
				console.error(e.response.data);
				ctx.status = 401;
				ctx.body = e.response.data;
			}
		},
	);
	router.post<{ Params: { id: string } }>(
		"/v1/follow_requests/:id/reject",
		async (ctx) => {
			const BASE_URL = `${ctx.protocol}://${ctx.hostname}`;
			const accessTokens = ctx.headers.authorization;
			const client = getClient(BASE_URL, accessTokens);
			try {
				const data = await client.rejectFollowRequest(
					convertId(ctx.params.id, IdType.FirefishId),
				);
				ctx.body = convertRelationship(data.data);
			} catch (e: any) {
				console.error(e);
				console.error(e.response.data);
				ctx.status = 401;
				ctx.body = e.response.data;
			}
		},
	);
}
