import type { User } from "@/models/entities/user.js";
import { resolveUser } from "@/remote/resolve-user.js";
import { DAY } from "@/const.js";
import DeliverManager from "@/remote/activitypub/deliver-manager.js";
import { renderActivity } from "@/remote/activitypub/renderer/index.js";
import define from "../../define.js";
import { ApiError } from "../../error.js";
import { apiLogger } from "../../logger.js";
import deleteFollowing from "@/services/following/delete.js";
import create from "@/services/following/create.js";
import { getUser } from "@/server/api/common/getters.js";
import { Followings, Users } from "@/models/index.js";
import config from "@/config/index.js";
import { publishMainStream } from "@/services/stream.js";
import { parse } from "@/misc/acct.js";

export const meta = {
	tags: ["users"],

	secure: true,
	requireCredential: true,

	limit: {
		duration: DAY,
		max: 5,
	},

	errors: {
		noSuchMoveTarget: {
			message: "No such move target.",
			code: "NO_SUCH_MOVE_TARGET",
			id: "b5c90186-4ab0-49c8-9bba-a1f76c202ba4",
		},
		remoteAccountForbids: {
			message:
				"Remote account doesn't have proper 'Known As' alias. Did you remember to set it?",
			code: "REMOTE_ACCOUNT_FORBIDS",
			id: "b5c90186-4ab0-49c8-9bba-a1f766282ba4",
		},
		notRemote: {
			message: "User is not remote. You can only migrate to other instances.",
			code: "NOT_REMOTE",
			id: "4362f8dc-731f-4ad8-a694-be2a88922a24",
		},
		adminForbidden: {
			message: "Admins cant migrate.",
			code: "NOT_ADMIN_FORBIDDEN",
			id: "4362e8dc-731f-4ad8-a694-be2a88922a24",
		},
		noSuchUser: {
			message: "No such user.",
			code: "NO_SUCH_USER",
			id: "fcd2eef9-a9b2-4c4f-8624-038099e90aa5",
		},
		uriNull: {
			message: "User ActivityPup URI is null.",
			code: "URI_NULL",
			id: "bf326f31-d430-4f97-9933-5d61e4d48a23",
		},
		localUriNull: {
			message: "Local User ActivityPup URI is null.",
			code: "URI_NULL",
			id: "95ba11b9-90e8-43a5-ba16-7acc1ab32e71",
		},
		alreadyMoved: {
			message: "Account was already moved to another account.",
			code: "ALREADY_MOVED",
			id: "b234a14e-9ebe-4581-8000-074b3c215962",
		},
	},
} as const;

export const paramDef = {
	type: "object",
	properties: {
		moveToAccount: { type: "string" },
	},
	required: ["moveToAccount"],
} as const;

function moveActivity(toUrl: string, fromUrl: string) {
	const activity = {
		id: null,
		actor: fromUrl,
		type: "Move",
		object: fromUrl,
		target: toUrl,
	} as any;

	return renderActivity(activity);
}

export default define(meta, paramDef, async (ps, user) => {
	if (!ps.moveToAccount) throw new ApiError(meta.errors.noSuchMoveTarget);
	if (user.isAdmin) throw new ApiError(meta.errors.adminForbidden);
	if (user.movedToUri) throw new ApiError(meta.errors.alreadyMoved);

	const { username, host } = parse(ps.moveToAccount);
	if (!host) throw new ApiError(meta.errors.notRemote);

	const moveTo: User = await resolveUser(username, host).catch((e) => {
		apiLogger.warn(`failed to resolve remote user: ${e}`);
		throw new ApiError(meta.errors.noSuchMoveTarget);
	});
	let fromUrl: string | null = user.uri;
	if (!fromUrl) {
		fromUrl = `${config.url}/users/${user.id}`;
	}

	let toUrl: string | null = moveTo.uri;
	if (!toUrl) {
		throw new ApiError(meta.errors.uriNull);
	}

	let allowed = false;

	moveTo.alsoKnownAs?.forEach((element) => {
		if (fromUrl!.includes(element)) allowed = true;
	});

	if (!(allowed && toUrl && fromUrl))
		throw new ApiError(meta.errors.remoteAccountForbids);

	const updates = {} as Partial<User>;

	if (!toUrl) toUrl = "";
	updates.movedToUri = toUrl;
	updates.alsoKnownAs = user.alsoKnownAs?.concat(toUrl) ?? [toUrl];

	await Users.update(user.id, updates);
	const iObj = await Users.pack<true, true>(user.id, user, {
		detail: true,
		includeSecrets: true,
	});

	const moveAct = moveActivity(toUrl, fromUrl);
	const dm = new DeliverManager(user, moveAct);
	dm.addFollowersRecipe();
	dm.execute();

	// Publish meUpdated event
	publishMainStream(user.id, "meUpdated", iObj);

	const followings = await Followings.findBy({
		followeeId: user.id,
	});

	followings.forEach(async (following) => {
		//if follower is local
		if (!following.followerHost) {
			const follower = await getUser(following.followerId).catch((e) => {
				if (e.id === "15348ddd-432d-49c2-8a5a-8069753becff")
					throw new ApiError(meta.errors.noSuchUser);
				throw e;
			});
			await deleteFollowing(follower!, user);
			try {
				await create(follower!, moveTo);
			} catch (e) {
				/* empty */
			}
		}
	});

	return iObj;
});
