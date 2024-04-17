import define from "../../define.js";
import { Hashtags } from "@/models/index.js";

export const meta = {
	requireCredential: true,
	requireCredentialPrivateMode: true,

	res: {
		type: "array"
	},

	errors: {
	},
} as const;

export const paramDef = {
} as const;

export default define(meta, paramDef, async (ps, user) => {
	return await Hashtags.createQueryBuilder()
		.where("name IN (:...hashtags)", { hashtags: user.blockedHashtags })
		.getMany()
});
