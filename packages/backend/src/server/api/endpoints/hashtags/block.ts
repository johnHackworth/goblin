import define from "../../define.js";
import { ApiError } from "../../error.js";
import { Users, Hashtags } from "@/models/index.js";
import { normalizeForSearch } from "@/misc/normalize-for-search.js";

export const meta = {
	requireCredential: true,
	requireCredentialPrivateMode: true,

	tags: ["hashtag"],

	res: {
		type: "object",
		properties: {
			name: { type: "string", nullable: false },
			url: { type: "string", nullable: false },
			history: { type: "array" },
			following: { type: "boolean" },
			blocked: { type: "boolean" },
		},
	},

	errors: {
		noSuchHashtag: {
			message: "No such hashtag.",
			code: "NO_SUCH_HASHTAG",
			id: "110ee688-193e-4a3a-9ecf-c167b2e6981e",
		},
	},
} as const;

export const paramDef = {
	type: "object",
	properties: {
		hashtag: { type: "string" },
	},
	required: ["hashtag"],
} as const;

export default define(meta, paramDef, async (ps, user) => {
	const hashtag = await Hashtags.findOneBy({
		name: normalizeForSearch(ps.hashtag),
	});
	if (hashtag == null) {
		throw new ApiError(meta.errors.noSuchHashtag);
	}

	const q = Users.createQueryBuilder()
		.where("id = :id", { id: user.id })
		.update()
		.set({
			blockedHashtags: () => `array_append(
				array_remove("blockedHashtags", :hashtag),
				:hashtag
			)`,
		})
		.setParameter("hashtag", hashtag.name);

	await q.execute();

	return {
		hashtag
	};
});
