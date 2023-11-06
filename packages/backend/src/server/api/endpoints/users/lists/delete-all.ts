import { UserLists } from "@/models/index.js";
import define from "../../../define.js";
import { ApiError } from "../../../error.js";

export const meta = {
	tags: ["lists"],

	requireCredential: true,

	kind: "write:account",

	description: "Delete all lists of users.",

	errors: {
		noSuchList: {
			message: "No such list.",
			code: "NO_SUCH_LIST",
			id: "78436795-db79-42f5-b1e2-55ea2cf19166",
		},
	},
} as const;

export const paramDef = {
	type: "object",
} as const;

export default define(meta, paramDef, async (ps, user) => {
	while ((await UserLists.findOneBy({ userId: user.id })) != null) {
		const userList = await UserLists.findOneBy({ userId: user.id });
		if (userList == null) {
			throw new ApiError(meta.errors.noSuchList);
		}
		await UserLists.delete(userList.id);
	}
});
