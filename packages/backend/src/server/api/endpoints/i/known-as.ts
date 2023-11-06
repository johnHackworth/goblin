import type { User } from "@/models/entities/user.js";
import { Users } from "@/models/index.js";
import { resolveUser } from "@/remote/resolve-user.js";
import acceptAllFollowRequests from "@/services/following/requests/accept-all.js";
import { publishToFollowers } from "@/services/i/update.js";
import { publishMainStream } from "@/services/stream.js";
import { DAY } from "@/const.js";
import { apiLogger } from "../../logger.js";
import define from "../../define.js";
import { ApiError } from "../../error.js";
import { parse } from "@/misc/acct.js";

export const meta = {
	tags: ["users"],

	secure: true,
	requireCredential: true,

	limit: {
		duration: DAY,
		max: 30,
	},

	errors: {
		noSuchUser: {
			message: "No such user.",
			code: "NO_SUCH_USER",
			id: "fcd2eef9-a9b2-4c4f-8624-038099e90aa5",
		},
		notRemote: {
			message: "User is not remote. You can only migrate to other instances.",
			code: "NOT_REMOTE",
			id: "4362f8dc-731f-4ad8-a694-be2a88922a24",
		},
		uriNull: {
			message: "User ActivityPup URI is null.",
			code: "URI_NULL",
			id: "bf326f31-d430-4f97-9933-5d61e4d48a23",
		},
		alreadyMoved: {
			message: "You have already moved your account.",
			code: "ALREADY_MOVED",
			id: "56f20ec9-fd06-4fa5-841b-edd6d7d4fa31",
		},
		yourself: {
			message: "You can't set yourself as your own alias.",
			code: "FORBIDDEN_TO_SET_YOURSELF",
			id: "25c90186-4ab0-49c8-9bba-a1fa6c202ba4",
		},
	},
} as const;

export const paramDef = {
	type: "object",
	properties: {
		alsoKnownAs: {
			type: "array",
			maxItems: 10,
			uniqueItems: true,
			items: { type: "string" },
		},
	},
	required: ["alsoKnownAs"],
} as const;

export default define(meta, paramDef, async (ps, user) => {
	if (!ps.alsoKnownAs) throw new ApiError(meta.errors.noSuchUser);
	if (user.movedToUri) throw new ApiError(meta.errors.alreadyMoved);

	const newAka = new Set<string>();

	for (const line of ps.alsoKnownAs) {
		if (!line) throw new ApiError(meta.errors.noSuchUser);
		const { username, host } = parse(line);

		const aka = await resolveUser(username, host).catch((e) => {
			apiLogger.warn(`failed to resolve remote user: ${e}`);
			throw new ApiError(meta.errors.noSuchUser);
		});

		if (aka.id === user.id) throw new ApiError(meta.errors.yourself);
		if (!aka.uri) throw new ApiError(meta.errors.uriNull);

		newAka.add(aka.uri);
	}

	const updates = {
		alsoKnownAs: newAka.size > 0 ? Array.from(newAka) : null,
	} as Partial<User>;

	await Users.update(user.id, updates);

	const iObj = await Users.pack<true, true>(user.id, user, {
		detail: true,
		includeSecrets: true,
	});

	// Publish meUpdated event
	publishMainStream(user.id, "meUpdated", iObj);

	if (user.isLocked === false) {
		acceptAllFollowRequests(user);
	}

	publishToFollowers(user.id);

	return iObj;
});
