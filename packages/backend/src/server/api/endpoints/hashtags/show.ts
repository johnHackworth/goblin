import define from "../../define.js";
import { ApiError } from "../../error.js";
import { Hashtags } from "@/models/index.js";
import { normalizeForSearch } from "@/misc/normalize-for-search.js";

export const meta = {
	tags: ["hashtags"],

	requireCredential: false,
	requireCredentialPrivateMode: true,

	res: {
		type: "object",
		optional: false,
		nullable: false,
		ref: "Hashtag",
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
		tag: { type: "string" },
	},
	required: ["tag"],
} as const;

export default define(meta, paramDef, async (ps, user) => {
	const hashtag = await Hashtags.findOneBy({
		name: normalizeForSearch(ps.tag),
	});
	if (hashtag == null) {
		throw new ApiError(meta.errors.noSuchHashtag);
	}

	return {
		...(user
			? {
					following: user.followedHashtags.includes(hashtag.name),
					blocking: user.blockedHashtags.includes(hashtag.name),
			  }
			: {}),
		...(await Hashtags.pack(hashtag)),
	};
});
