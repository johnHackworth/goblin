import type { FindOptionsWhere } from "typeorm";
import { In, IsNull } from "typeorm";
import { resolveUser } from "@/remote/resolve-user.js";
import { Users } from "@/models/index.js";
import type { User } from "@/models/entities/user.js";
import define from "../../define.js";
import { apiLogger } from "../../logger.js";
import { ApiError } from "../../error.js";
import { fetchTumblrFeed, updateTumblrUser } from "@/services/tumblr/index.js";

export const meta = {
	tags: ["users"],

	requireCredential: false,
	requireCredentialPrivateMode: true,

	description: "Show the properties of a user.",

	res: {
		optional: false,
		nullable: false,
		oneOf: [
			{
				type: "object",
				ref: "UserDetailed",
			},
			{
				type: "array",
				items: {
					type: "object",
					ref: "UserDetailed",
				},
			},
		],
	},

	errors: {
		failedToResolveRemoteUser: {
			message: "Failed to resolve remote user.",
			code: "FAILED_TO_RESOLVE_REMOTE_USER",
			id: "ef7b9be4-9cba-4e6f-ab41-90ed171c7d3c",
			kind: "server",
		},

		noSuchUser: {
			message: "No such user.",
			code: "NO_SUCH_USER",
			id: "4362f8dc-731f-4ad8-a694-be5a88922a24",
		},
	},
} as const;

export const paramDef = {
	type: "object",
	anyOf: [
		{
			properties: {
				userId: { type: "string" },
			},
			required: ["userId"],
		},
		{
			properties: {
				userIds: {
					type: "array",
					uniqueItems: true,
					items: {
						type: "string",
					},
				},
			},
			required: ["userIds"],
		},
		{
			properties: {
				username: { type: "string" },
				host: {
					type: "string",
					nullable: true,
					description: "The local host is represented with `null`.",
				},
			},
			required: ["username"],
		},
	],
} as const;

export default define(meta, paramDef, async (ps, me) => {
	let user;

	const isAdminOrModerator = me && (me.isAdmin || me.isModerator);
 apiLogger.warn('USERS/SHOW')
	if (ps.userIds) {
		apiLogger.warn('USERS/SHOW user ids')
		if (ps.userIds.length === 0) {
			return [];
		}

		const isUrl = ps.userIds[0].startsWith("http");
		let users: User[];
		if (isUrl) {
			users = await Users.findBy(
				isAdminOrModerator
					? { uri: In(ps.userIds) }
					: { uri: In(ps.userIds), isSuspended: false },
			);
		} else {
			users = await Users.findBy(
				isAdminOrModerator
					? { id: In(ps.userIds) }
					: { id: In(ps.userIds), isSuspended: false },
			);
		}

		// リクエストされた通りに並べ替え
		const _users: User[] = [];
		for (const id of ps.userIds) {
			const res = users.find((x) => (isUrl ? x.uri === id : x.id === id));
			if (res) _users.push(res);
		}

		return await Promise.all(
			_users.map((u) =>
				Users.pack(u, me, {
					detail: true,
				}),
			),
		);
	} else {
		 apiLogger.warn('USERS/SHOW no user ids: ' + ps.username)
		// Lookup user
		if (typeof ps.host === "string" && typeof ps.username === "string") {
			user = await resolveUser(ps.username, ps.host).catch((e) => {
				apiLogger.warn(`failed to resolve remote user: ${e}`);
				throw new ApiError(meta.errors.failedToResolveRemoteUser);
			});
		} else if (!ps.host && ps.username && ps.username.indexOf('_at_tumblr_com') > 1) {
			apiLogger.warn('to tumblr!');
      user = await resolveUser(ps.username, ps.host).catch((e)=>{
        apiLogger.warn(`failed to resolve tumblr user: ${e}`);
        throw new ApiError(meta.errors.failedToResolveRemoteUser);
      });
      apiLogger.warn('resolved');
    } else if (!ps.host && ps.username && ps.username.indexOf('.tumblr.com') > 1) {
    	const username = ps.username.split('.tumblr.com').join('_at_tumblr_com');
      user = await resolveUser(username, ps.host).catch((e)=>{
        apiLogger.warn(`failed to resolve tumblr user: ${e}`);
        throw new ApiError(meta.errors.failedToResolveRemoteUser);
      });
    } else {
			const q: FindOptionsWhere<User> =
				ps.userId != null
					? ps.userId.startsWith("http")
						? { uri: ps.userId }
						: { id: ps.userId }
					: { usernameLower: ps.username!.toLowerCase(), host: IsNull() };

			user = await Users.findOneBy(q);
		}
		if (user == null || (!isAdminOrModerator && user.isSuspended)) {
			throw new ApiError(meta.errors.noSuchUser);
		}
		if(user.tumblrUUID) {
		apiLogger.warn('go to update user')
			await updateTumblrUser(user.username.toLowerCase());
			await fetchTumblrFeed(user);
		}

		return await Users.pack(user, me, {
			detail: true,
		});
	}
});
