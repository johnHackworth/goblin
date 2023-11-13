import define from "../../../define.js";
import { DriveFiles } from "@/models/index.js";

export const meta = {
	tags: ["drive"],

	requireCredential: true,

	kind: "read:drive",

	description: "Check if a given file exists.",

	res: {
		type: "boolean",
		optional: false,
		nullable: false,
	},
} as const;

export const paramDef = {
	type: "object",
	properties: {
		md5: { type: "string" },
	},
	required: ["md5"],
} as const;

export default define(meta, paramDef, async (ps, user) => {
	const exist = await DriveFiles.exist({
		where: {
			md5: ps.md5,
			userId: user.id,
		},
	});

	return exist;
});
