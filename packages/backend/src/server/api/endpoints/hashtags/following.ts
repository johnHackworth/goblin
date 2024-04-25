import define from "../../define.js";
import { Hashtags } from "@/models/index.js";

export const meta = {
	requireCredential: true,
	requireCredentialPrivateMode: true,

	res: {
		type: "array",
	},

	errors: {},
} as const;

export const paramDef = {} as const;

export default define(meta, paramDef, async (ps, user) => {
	const hashtags = await Hashtags.createQueryBuilder("h")
		.where("array_position(me.followedHashtags, h.name) IS NOT NULL")
		.innerJoin("user", "me", "me.id = :meId", { meId: user.id })
		.cache(false)
		.getMany();

	return Hashtags.packMany(hashtags);
});
