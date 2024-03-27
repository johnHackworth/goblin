import { NoteReactions, UserProfiles } from "@/models/index.js";
import define from "../../define.js";
import { makePaginationQuery } from "../../common/make-pagination-query.js";
import { generateVisibilityQuery } from "../../common/generate-visibility-query.js";
import { ApiError } from "../../error.js";
import { createNewTumblrUser } from "@/services/tumblr/index.js";

export const meta = {
	tags: ["users", "tumblr"],

	requireCredential: false,
	requireCredentialPrivateMode: true,

	description: "get tumblr user",
} as const;

export const paramDef = {
	type: "object",
	properties: {
		username: { type: "string" },
	},
	required: ["username"],
} as const;

export default define(meta, paramDef, async (ps) => {
	return await createNewTumblrUser(ps.username);
});
